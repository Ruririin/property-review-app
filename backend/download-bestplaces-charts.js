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
        // Comprehensive ZIP code mapping for major US areas
        const zipCodeDatabase = {
            // California ZIP codes
            '90210': { state: 'california', city: 'beverly_hills', displayName: 'Beverly Hills' },
            '90041': { state: 'california', city: 'los_angeles', displayName: 'Los Angeles' },
            '90401': { state: 'california', city: 'santa_monica', displayName: 'Santa Monica' },
            '90291': { state: 'california', city: 'venice', displayName: 'Venice' },
            '91601': { state: 'california', city: 'north_hollywood', displayName: 'North Hollywood' },
            '91801': { state: 'california', city: 'alhambra', displayName: 'Alhambra' },
            '92101': { state: 'california', city: 'san_diego', displayName: 'San Diego' },
            '92037': { state: 'california', city: 'la_jolla', displayName: 'La Jolla' },
            '94102': { state: 'california', city: 'san_francisco', displayName: 'San Francisco' },
            '94105': { state: 'california', city: 'san_francisco', displayName: 'San Francisco' },
            '95126': { state: 'california', city: 'san_jose', displayName: 'San Jose' },
            '95014': { state: 'california', city: 'cupertino', displayName: 'Cupertino' },
            
            // New York ZIP codes
            '10001': { state: 'new_york', city: 'new_york', displayName: 'New York City' },
            '10021': { state: 'new_york', city: 'new_york', displayName: 'New York City' },
            '10025': { state: 'new_york', city: 'new_york', displayName: 'New York City' },
            '10128': { state: 'new_york', city: 'new_york', displayName: 'New York City' },
            '11201': { state: 'new_york', city: 'brooklyn', displayName: 'Brooklyn' },
            '11375': { state: 'new_york', city: 'forest_hills', displayName: 'Forest Hills' },
            
            // Texas ZIP codes
            '75201': { state: 'texas', city: 'dallas', displayName: 'Dallas' },
            '75254': { state: 'texas', city: 'dallas', displayName: 'Dallas' },
            '77001': { state: 'texas', city: 'houston', displayName: 'Houston' },
            '77056': { state: 'texas', city: 'houston', displayName: 'Houston' },
            '78701': { state: 'texas', city: 'austin', displayName: 'Austin' },
            '78759': { state: 'texas', city: 'austin', displayName: 'Austin' },
            
            // Florida ZIP codes
            '33101': { state: 'florida', city: 'miami', displayName: 'Miami' },
            '33139': { state: 'florida', city: 'miami_beach', displayName: 'Miami Beach' },
            '32801': { state: 'florida', city: 'orlando', displayName: 'Orlando' },
            '33701': { state: 'florida', city: 'st_petersburg', displayName: 'St. Petersburg' },
            
            // Illinois ZIP codes
            '60601': { state: 'illinois', city: 'chicago', displayName: 'Chicago' },
            '60614': { state: 'illinois', city: 'chicago', displayName: 'Chicago' },
            
            // Washington ZIP codes
            '98101': { state: 'washington', city: 'seattle', displayName: 'Seattle' },
            '98104': { state: 'washington', city: 'seattle', displayName: 'Seattle' },
            
            // Oregon ZIP codes
            '97201': { state: 'oregon', city: 'portland', displayName: 'Portland' },
            '97239': { state: 'oregon', city: 'portland', displayName: 'Portland' },
            
            // Nevada ZIP codes
            '89101': { state: 'nevada', city: 'las_vegas', displayName: 'Las Vegas' },
            '89109': { state: 'nevada', city: 'las_vegas', displayName: 'Las Vegas' }
        };
        
        // If exact ZIP code found, return it
        if (zipCodeDatabase[zipCode]) {
            return zipCodeDatabase[zipCode];
        }
        
        // Smart fallback based on ZIP code ranges
        const zipNum = parseInt(zipCode);
        
        // California ZIP code ranges
        if (zipNum >= 90001 && zipNum <= 96162) {
            if (zipNum >= 90001 && zipNum <= 90899) {
                return { state: 'california', city: 'los_angeles', displayName: 'Los Angeles Area' };
            } else if (zipNum >= 91000 && zipNum <= 91999) {
                return { state: 'california', city: 'pasadena', displayName: 'Pasadena Area' };
            } else if (zipNum >= 92000 && zipNum <= 92999) {
                return { state: 'california', city: 'san_diego', displayName: 'San Diego Area' };
            } else if (zipNum >= 94000 && zipNum <= 94999) {
                return { state: 'california', city: 'san_francisco', displayName: 'San Francisco Area' };
            } else if (zipNum >= 95000 && zipNum <= 95999) {
                return { state: 'california', city: 'san_jose', displayName: 'San Jose Area' };
            }
        }
        
        // New York ZIP code ranges
        if (zipNum >= 10001 && zipNum <= 14999) {
            if (zipNum >= 10001 && zipNum <= 10299) {
                return { state: 'new_york', city: 'new_york', displayName: 'New York City' };
            } else if (zipNum >= 11200 && zipNum <= 11299) {
                return { state: 'new_york', city: 'brooklyn', displayName: 'Brooklyn' };
            }
            return { state: 'new_york', city: 'new_york', displayName: 'New York Area' };
        }
        
        // Texas ZIP code ranges
        if (zipNum >= 75000 && zipNum <= 79999) {
            if (zipNum >= 75000 && zipNum <= 75399) {
                return { state: 'texas', city: 'dallas', displayName: 'Dallas Area' };
            } else if (zipNum >= 77000 && zipNum <= 77999) {
                return { state: 'texas', city: 'houston', displayName: 'Houston Area' };
            } else if (zipNum >= 78700 && zipNum <= 78799) {
                return { state: 'texas', city: 'austin', displayName: 'Austin Area' };
            }
            return { state: 'texas', city: 'dallas', displayName: 'Texas Area' };
        }
        
        // Florida ZIP code ranges
        if (zipNum >= 32000 && zipNum <= 34999) {
            if (zipNum >= 33100 && zipNum <= 33199) {
                return { state: 'florida', city: 'miami', displayName: 'Miami Area' };
            } else if (zipNum >= 32800 && zipNum <= 32899) {
                return { state: 'florida', city: 'orlando', displayName: 'Orlando Area' };
            }
            return { state: 'florida', city: 'miami', displayName: 'Florida Area' };
        }
        
        // Illinois ZIP code ranges  
        if (zipNum >= 60000 && zipNum <= 62999) {
            return { state: 'illinois', city: 'chicago', displayName: 'Chicago Area' };
        }
        
        // Washington ZIP code ranges
        if (zipNum >= 98000 && zipNum <= 99499) {
            return { state: 'washington', city: 'seattle', displayName: 'Seattle Area' };
        }
        
        // Default fallback - most common case
        console.log('⚠️ Unknown ZIP code:', zipCode, '- defaulting to Los Angeles');
        return { state: 'california', city: 'los_angeles', displayName: 'Los Angeles Area' };
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
                    property_crime_us_avg: 35.4,
                    location: '',
                    zip_code: '',
                    crime_scale_text: '', // Crime scale explanation from p tag
                    full_text: ''
                };
                
                // First, try to extract from specific HTML elements (h5 tags)
                console.log('🔍 Looking for h5 tags with crime data...');
                const h5Elements = document.querySelectorAll('h5');
                
                // Look for the crime ranking scale in p tags
                const pElements = document.querySelectorAll('p');
                let crimeScaleText = '';
                
                pElements.forEach(p => {
                    const text = p.textContent || '';
                    if (text.includes('Crime is ranked on a scale of 1')) {
                        crimeScaleText = text.trim();
                        console.log('✅ Found crime scale text in p tag:', crimeScaleText);
                    }
                });
                
                // Extract crime data from h5 elements
                h5Elements.forEach((h5, index) => {
                    const h5Text = h5.textContent || '';
                    console.log(`📊 H5 element ${index + 1}:`, h5Text);
                    
                    // Pattern for: "Location (zip 12345) violent crime is 8.5. (The US average is 22.7)"
                    const violentH5Pattern = /([^(]+)\s*\(zip\s+(\d{5})\)\s+violent crime is\s+(\d+\.?\d*)\.\s*\(The US average is\s+(\d+\.?\d*)\)/i;
                    const violentH5Match = h5Text.match(violentH5Pattern);
                    
                    if (violentH5Match) {
                        stats.location = violentH5Match[1].trim().replace(/^"|"$/g, '').replace(/\n/g, ' ').trim(); // Remove quotes and newlines
                        stats.zip_code = violentH5Match[2];
                        stats.violent_crime = parseFloat(violentH5Match[3]);
                        stats.violent_crime_us_avg = parseFloat(violentH5Match[4]);
                        console.log('✅ Extracted violent crime from H5:', {
                            location: stats.location,
                            zip: stats.zip_code,
                            violent: stats.violent_crime,
                            violent_avg: stats.violent_crime_us_avg
                        });
                    }
                    
                    // Pattern for: "Location (zip 12345) property crime is 21.5. (The US average is 35.4)"
                    const propertyH5Pattern = /([^(]+)\s*\(zip\s+(\d{5})\)\s+property crime is\s+(\d+\.?\d*)\.\s*\(The US average is\s+(\d+\.?\d*)\)/i;
                    const propertyH5Match = h5Text.match(propertyH5Pattern);
                    
                    if (propertyH5Match) {
                        if (!stats.location) {
                            stats.location = propertyH5Match[1].trim().replace(/^"|"$/g, '').replace(/\n/g, ' ').trim(); // Remove quotes and newlines
                        }
                        if (!stats.zip_code) {
                            stats.zip_code = propertyH5Match[2];
                        }
                        stats.property_crime = parseFloat(propertyH5Match[3]);
                        stats.property_crime_us_avg = parseFloat(propertyH5Match[4]);
                        console.log('✅ Extracted property crime from H5:', {
                            location: stats.location,
                            zip: stats.zip_code,
                            property: stats.property_crime,
                            property_avg: stats.property_crime_us_avg
                        });
                    }
                });
                
                // Store the crime scale explanation
                stats.crime_scale_text = crimeScaleText;
                
                // Get all text content as fallback
                const text = document.body.innerText || '';
                
                // Enhanced pattern matching for the exact format:
                // "Los Angeles (zip 90041) violent crime is 31.9. (The US average is 22.7)"
                // "Los Angeles (zip 90041) property crime is 39.0. (The US average is 35.4)"
                
                // Pattern for violent crime: "(location) (zip code) violent crime is (number). (The US average is (number))"
                const violentPattern = /([^(]+)\s*\(zip\s+(\d{5})\)\s+violent crime is\s+(\d+\.?\d*)\.\s*\(The US average is\s+(\d+\.?\d*)\)/i;
                const violentMatch = text.match(violentPattern);
                
                if (violentMatch) {
                    stats.location = violentMatch[1].trim();
                    stats.zip_code = violentMatch[2];
                    stats.violent_crime = parseFloat(violentMatch[3]);
                    stats.violent_crime_us_avg = parseFloat(violentMatch[4]);
                    console.log('✅ Extracted violent crime data:', {
                        location: stats.location,
                        zip: stats.zip_code,
                        violent: stats.violent_crime,
                        violent_avg: stats.violent_crime_us_avg
                    });
                }
                
                // Pattern for property crime: "(location) (zip code) property crime is (number). (The US average is (number))"
                const propertyPattern = /([^(]+)\s*\(zip\s+(\d{5})\)\s+property crime is\s+(\d+\.?\d*)\.\s*\(The US average is\s+(\d+\.?\d*)\)/i;
                const propertyMatch = text.match(propertyPattern);
                
                if (propertyMatch) {
                    // Use location from violent crime if not already set, or update if more specific
                    if (!stats.location) {
                        stats.location = propertyMatch[1].trim();
                    }
                    if (!stats.zip_code) {
                        stats.zip_code = propertyMatch[2];
                    }
                    stats.property_crime = parseFloat(propertyMatch[3]);
                    stats.property_crime_us_avg = parseFloat(propertyMatch[4]);
                    console.log('✅ Extracted property crime data:', {
                        location: stats.location,
                        zip: stats.zip_code,
                        property: stats.property_crime,
                        property_avg: stats.property_crime_us_avg
                    });
                }
                
                // Store the raw text for debugging
                stats.full_text = text.substring(0, 1000); // First 1000 chars for debugging
                
                // Fallback: Look for less specific patterns if exact patterns don't match
                if (stats.violent_crime === 0.0 || stats.property_crime === 0.0) {
                    console.log('⚠️ Exact patterns not found, trying fallback patterns...');
                    
                    // Fallback pattern for violent crime
                    if (stats.violent_crime === 0.0) {
                        const fallbackViolent = /violent crime is\s+(\d+\.?\d*)/i;
                        const fallbackVMatch = text.match(fallbackViolent);
                        if (fallbackVMatch) {
                            stats.violent_crime = parseFloat(fallbackVMatch[1]);
                            console.log('📋 Fallback violent crime:', stats.violent_crime);
                        }
                    }
                    
                    // Fallback pattern for property crime
                    if (stats.property_crime === 0.0) {
                        const fallbackProperty = /property crime is\s+(\d+\.?\d*)/i;
                        const fallbackPMatch = text.match(fallbackProperty);
                        if (fallbackPMatch) {
                            stats.property_crime = parseFloat(fallbackPMatch[1]);
                            console.log('📋 Fallback property crime:', stats.property_crime);
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
