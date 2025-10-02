#!/usr/bin/env node

/**
 * Best Places Puppeteer Automation Script
 * Called by Django backend to download actual Best Places crime charts
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class BestPlacesDownloader {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        if (this.browser) return;

        console.log('🚀 Initializing Puppeteer browser...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            defaultViewport: {
                width: 1920,
                height: 1080
            }
        });

        this.page = await this.browser.newPage();
        
        await this.page.setJavaScriptEnabled(true);
        await this.page.setDefaultNavigationTimeout(60000);
        await this.page.setDefaultTimeout(30000);
        
        // Block unnecessary resources
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['font', 'media'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        console.log('✅ Browser initialized');
    }

    async downloadCharts(zipCode) {
        try {
            await this.initialize();
            
            console.log(`🔍 Fetching charts for ZIP: ${zipCode}`);
            
            const location = this.getLocationFromZip(zipCode);
            const crimePageUrl = this.buildCrimePageUrl(zipCode, location);
            
            console.log(`🌐 Navigating to: ${crimePageUrl}`);
            
            await this.page.goto(crimePageUrl, { 
                waitUntil: 'networkidle2',
                timeout: 60000 
            });
            
            // Wait for charts to load
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const results = await this.extractCharts();
            const crimeStats = await this.extractCrimeStatistics();
            
            if (results && (results.violentCrimeChart || results.propertyCrimeChart)) {
                console.log('✅ Successfully extracted charts');
                return {
                    success: true,
                    chart_images: results,
                    crime_stats: crimeStats,
                    source: 'bestplaces_puppeteer',
                    url: crimePageUrl,
                    extracted_at: new Date().toISOString()
                };
            }
            
            console.warn('⚠️ No charts found');
            return { success: false, error: 'No charts found' };
            
        } catch (error) {
            console.error('❌ Error downloading charts:', error);
            return { success: false, error: error.message };
        }
    }

    async extractCharts() {
        const results = {};
        
        try {
            // Method 1: Screenshot chart areas
            console.log('📸 Taking chart area screenshots...');
            const screenshotResults = await this.extractViaScreenshots();
            if (screenshotResults) {
                Object.assign(results, screenshotResults);
            }
            
            // Method 2: Try interactive chart navigation
            console.log('🔄 Attempting chart navigation...');
            const navigationResults = await this.extractViaNavigation();
            if (navigationResults) {
                Object.assign(results, navigationResults);
            }
            
            return Object.keys(results).length > 0 ? results : null;
            
        } catch (error) {
            console.error('❌ Error extracting charts:', error);
            return null;
        }
    }

    async extractViaScreenshots() {
        try {
            const results = {};
            
            const chartSelectors = [
                '.highcharts-container',
                '[id*="chart"]',
                '[class*="chart"]',
                'svg',
                '.chart-container'
            ];
            
            for (const selector of chartSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    
                    if (elements.length > 0) {
                        console.log(`📸 Found ${elements.length} elements with selector: ${selector}`);
                        
                        for (let i = 0; i < Math.min(elements.length, 2); i++) {
                            const element = elements[i];
                            const boundingBox = await element.boundingBox();
                            
                            if (boundingBox && boundingBox.width > 200 && boundingBox.height > 150) {
                                console.log(`📊 Taking screenshot of chart ${i + 1}`);
                                
                                const screenshot = await element.screenshot({
                                    type: 'png',
                                    encoding: 'base64'
                                });
                                
                                if (screenshot) {
                                    const chartType = await this.determineChartType(element);
                                    const dataUrl = `data:image/png;base64,${screenshot}`;
                                    
                                    if (chartType === 'violent' && !results.violentCrimeChart) {
                                        results.violentCrimeChart = {
                                            dataUrl: dataUrl,
                                            type: 'violent_crime',
                                            method: 'screenshot'
                                        };
                                    } else if (chartType === 'property' && !results.propertyCrimeChart) {
                                        results.propertyCrimeChart = {
                                            dataUrl: dataUrl,
                                            type: 'property_crime',
                                            method: 'screenshot'
                                        };
                                    } else if (!results.violentCrimeChart) {
                                        results.violentCrimeChart = {
                                            dataUrl: dataUrl,
                                            type: 'violent_crime',
                                            method: 'screenshot'
                                        };
                                    } else if (!results.propertyCrimeChart) {
                                        results.propertyCrimeChart = {
                                            dataUrl: dataUrl,
                                            type: 'property_crime',
                                            method: 'screenshot'
                                        };
                                    }
                                }
                            }
                        }
                    }
                } catch (selectorError) {
                    console.warn(`⚠️ Error with selector ${selector}:`, selectorError.message);
                }
            }
            
            return Object.keys(results).length > 0 ? results : null;
            
        } catch (error) {
            console.error('❌ Error in screenshot method:', error);
            return null;
        }
    }

    async extractViaNavigation() {
        try {
            const results = {};
            
            // Look for navigation links
            const navigationLinks = await this.page.$$('a[href*="javascript"], button[onclick*="chart"], [data-chart-type]');
            
            if (navigationLinks.length === 0) {
                return null;
            }
            
            console.log(`🔄 Found ${navigationLinks.length} potential navigation elements`);
            
            // Capture default chart
            const defaultChart = await this.captureCurrentChart();
            if (defaultChart) {
                results.violentCrimeChart = {
                    ...defaultChart,
                    type: 'violent_crime'
                };
            }
            
            // Try navigation links
            for (let i = 0; i < Math.min(navigationLinks.length, 3); i++) {
                const link = navigationLinks[i];
                
                try {
                    const linkText = await this.page.evaluate(el => {
                        return el.textContent || el.getAttribute('data-chart-type') || el.getAttribute('onclick') || '';
                    }, link);
                    
                    console.log(`🔄 Trying navigation link: "${linkText}"`);
                    
                        if (linkText.toLowerCase().includes('property')) {
                            await link.click();
                            await new Promise(resolve => setTimeout(resolve, 3000));                        const chartAfterClick = await this.captureCurrentChart();
                        if (chartAfterClick && !results.propertyCrimeChart) {
                            results.propertyCrimeChart = {
                                ...chartAfterClick,
                                type: 'property_crime'
                            };
                        }
                    }
                } catch (linkError) {
                    console.warn(`⚠️ Error with navigation link ${i + 1}:`, linkError.message);
                }
            }
            
            return Object.keys(results).length > 0 ? results : null;
            
        } catch (error) {
            console.error('❌ Error in navigation method:', error);
            return null;
        }
    }

    async captureCurrentChart() {
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const selectors = ['.highcharts-container', '[id*="chart"]', 'svg'];
            
            for (const selector of selectors) {
                const element = await this.page.$(selector);
                if (element) {
                    const boundingBox = await element.boundingBox();
                    
                    if (boundingBox && boundingBox.width > 200 && boundingBox.height > 150) {
                        const screenshot = await element.screenshot({
                            type: 'png',
                            encoding: 'base64'
                        });
                        
                        if (screenshot) {
                            return {
                                dataUrl: `data:image/png;base64,${screenshot}`,
                                method: 'navigation_screenshot'
                            };
                        }
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error capturing current chart:', error);
            return null;
        }
    }

    async determineChartType(element) {
        try {
            const context = await this.page.evaluate(el => {
                let current = el;
                let contextText = '';
                
                for (let i = 0; i < 3; i++) {
                    if (current) {
                        contextText += current.textContent || '';
                        contextText += current.className || '';
                        contextText += current.id || '';
                        current = current.parentElement;
                    }
                }
                
                return contextText.toLowerCase();
            }, element);
            
            if (context.includes('violent')) {
                return 'violent';
            } else if (context.includes('property')) {
                return 'property';
            }
            
            return 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    buildCrimePageUrl(zipCode, location) {
        const state = location.state.toLowerCase().replace(/\s+/g, '_');
        const city = location.city.toLowerCase().replace(/\s+/g, '_');
        return `https://www.bestplaces.net/crime/zip-code/${state}/${city}/${zipCode}`;
    }

    getLocationFromZip(zipCode) {
        const caZipCodes = {
            '90041': { state: 'california', city: 'los_angeles', displayName: 'Los Angeles' },
            '90210': { state: 'california', city: 'beverly_hills', displayName: 'Beverly Hills' },
            '91601': { state: 'california', city: 'north_hollywood', displayName: 'North Hollywood' },
            '92101': { state: 'california', city: 'san_diego', displayName: 'San Diego' },
            '94102': { state: 'california', city: 'san_francisco', displayName: 'San Francisco' },
            '95126': { state: 'california', city: 'san_jose', displayName: 'San Jose' }
        };
        
        return caZipCodes[zipCode] || { state: 'california', city: 'los_angeles', displayName: 'Los Angeles' };
    }

    async extractCrimeStatistics() {
        try {
            console.log('📊 Extracting crime statistics from page...');
            
            // Look for crime statistics in the page content
            const crimeStats = await this.page.evaluate(() => {
                const stats = {
                    violent_crime: 0.0,
                    property_crime: 0.0,
                    violent_crime_us_avg: 22.7,
                    property_crime_us_avg: 35.4
                };
                
                // Look for more specific patterns and avoid ZIP codes
                const text = document.body.innerText || '';
                
                // Look for numbers that are NOT the ZIP code (avoid 5-digit numbers like 90041)
                // Focus on crime rates which are typically under 100
                const lines = text.split('\n');
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].toLowerCase().trim();
                    
                    // Look for violent crime with specific context
                    if ((line.includes('violent') && line.includes('crime')) || 
                        line.includes('violent crimes')) {
                        // Find decimal numbers (crime rates) - avoid ZIP codes
                        const numbers = line.match(/\b(\d{1,2}\.?\d*)\b/g);
                        if (numbers) {
                            for (const num of numbers) {
                                const value = parseFloat(num);
                                // Crime rates are typically 0-100, avoid ZIP codes (90041)
                                if (value > 0 && value < 100 && stats.violent_crime === 0) {
                                    stats.violent_crime = value;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Look for property crime with specific context
                    if ((line.includes('property') && line.includes('crime')) || 
                        line.includes('property crimes')) {
                        const numbers = line.match(/\b(\d{1,2}\.?\d*)\b/g);
                        if (numbers) {
                            for (const num of numbers) {
                                const value = parseFloat(num);
                                // Crime rates are typically 0-100, avoid ZIP codes
                                if (value > 0 && value < 100 && stats.property_crime === 0) {
                                    stats.property_crime = value;
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // Alternative: Look for text patterns like "5.1 per 1,000" or similar
                if (stats.violent_crime === 0 || stats.property_crime === 0) {
                    const ratePattern = /(\d{1,2}\.?\d*)\s*(?:per\s*1,?000|\/\s*1,?000)/gi;
                    let match;
                    let rateCount = 0;
                    
                    while ((match = ratePattern.exec(text)) !== null && rateCount < 2) {
                        const rate = parseFloat(match[1]);
                        if (rate > 0 && rate < 100) {
                            if (rateCount === 0 && stats.violent_crime === 0) {
                                stats.violent_crime = rate;
                            } else if (rateCount === 1 && stats.property_crime === 0) {
                                stats.property_crime = rate;
                            }
                            rateCount++;
                        }
                    }
                }
                
                return stats;
            });
            
            console.log('📊 Extracted crime statistics:', crimeStats);
            return crimeStats;
            
        } catch (error) {
            console.error('❌ Error extracting crime statistics:', error);
            return {
                violent_crime: 0.0,
                property_crime: 0.0,
                violent_crime_us_avg: 22.7,
                property_crime_us_avg: 35.4
            };
        }
    }

    async cleanup() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            
            console.log('🧹 Cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
}

// Main execution
async function main() {
    const zipCode = process.argv[2];
    
    if (!zipCode) {
        console.error('Usage: node download-bestplaces-charts.js <zipcode>');
        process.exit(1);
    }
    
    const downloader = new BestPlacesDownloader();
    
    try {
        const result = await downloader.downloadCharts(zipCode);
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Fatal error:', error);
        console.log(JSON.stringify({ success: false, error: error.message }, null, 2));
    } finally {
        await downloader.cleanup();
        process.exit(0);
    }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, cleaning up...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, cleaning up...');
    process.exit(0);
});

if (require.main === module) {
    main();
}
