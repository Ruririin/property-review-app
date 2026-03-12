"""
PDF Screenshot Service - Uses Playwright to capture pixel-perfect screenshots
"""
import os
import base64
import tempfile
import logging
from io import BytesIO
from pathlib import Path
from playwright.sync_api import sync_playwright
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape
from PIL import Image

logger = logging.getLogger(__name__)

# Slide dimensions (matching frontend)
SLIDE_WIDTH = 1280
SLIDE_HEIGHT = 720

class PDFScreenshotService:
    """Service for creating PDFs from HTML screenshots using Playwright"""

    @staticmethod
    def create_pdf_from_html_slides(slides_html_list, output_path=None):
        """
        Create a PDF from a list of HTML slides by screenshotting them

        Args:
            slides_html_list: List of HTML strings, one per slide
            output_path: Optional path to save PDF (if None, returns BytesIO)

        Returns:
            BytesIO buffer containing the PDF, or path if output_path provided
        """
        try:
            logger.info(f"Creating PDF from {len(slides_html_list)} HTML slides")

            # Create temp directory for screenshots
            with tempfile.TemporaryDirectory() as temp_dir:
                screenshot_paths = []

                # Launch Playwright browser
                with sync_playwright() as p:
                    logger.info("Launching headless Chromium browser")
                    browser = p.chromium.launch(headless=True)
                    context = browser.new_context(
                        viewport={'width': SLIDE_WIDTH, 'height': SLIDE_HEIGHT},
                        device_scale_factor=1
                    )
                    page = context.new_page()

                    # Screenshot each slide
                    for i, html_content in enumerate(slides_html_list):
                        try:
                            logger.info(f"Processing slide {i + 1}/{len(slides_html_list)}")

                            # Set content and wait for everything to load
                            page.set_content(html_content, wait_until='networkidle')

                            # Wait for fonts and images to load
                            page.wait_for_timeout(2000)  # 2 seconds for fonts/images/external resources

                            # Screenshot to temp file
                            screenshot_path = os.path.join(temp_dir, f'slide_{i}.png')
                            page.screenshot(
                                path=screenshot_path,
                                full_page=False,
                                type='png'
                            )
                            screenshot_paths.append(screenshot_path)
                            logger.info(f"Screenshot saved: {screenshot_path}")

                        except Exception as e:
                            logger.error(f"Failed to screenshot slide {i + 1}: {e}")
                            raise

                    browser.close()

                # Create PDF from screenshots
                logger.info("Creating PDF from screenshots")
                pdf_buffer = PDFScreenshotService._create_pdf_from_images(screenshot_paths, output_path)

                return pdf_buffer

        except Exception as e:
            logger.error(f"Failed to create PDF from HTML slides: {e}")
            raise

    @staticmethod
    def _create_pdf_from_images(image_paths, output_path=None):
        """
        Create a PDF from a list of image files

        Args:
            image_paths: List of paths to image files
            output_path: Optional path to save PDF

        Returns:
            BytesIO buffer containing the PDF
        """
        try:
            # Create PDF in landscape mode
            if output_path:
                pdf_canvas = canvas.Canvas(output_path, pagesize=landscape((SLIDE_WIDTH, SLIDE_HEIGHT)))
            else:
                buffer = BytesIO()
                pdf_canvas = canvas.Canvas(buffer, pagesize=landscape((SLIDE_WIDTH, SLIDE_HEIGHT)))

            # Add each image as a page (convert to compressed JPEG first)
            for i, img_path in enumerate(image_paths):
                logger.info(f"Adding image {i + 1}/{len(image_paths)} to PDF")

                # Convert PNG to compressed JPEG to reduce file size
                img = Image.open(img_path).convert('RGB')
                jpeg_path = img_path.replace('.png', '.jpg')
                img.save(jpeg_path, 'JPEG', quality=75, optimize=True)

                # Draw image to fill the page
                pdf_canvas.drawImage(
                    jpeg_path,
                    0, 0,
                    width=SLIDE_WIDTH,
                    height=SLIDE_HEIGHT
                )

                # Add new page if not last image
                if i < len(image_paths) - 1:
                    pdf_canvas.showPage()

            # Save PDF
            pdf_canvas.save()
            logger.info("PDF created successfully")

            if output_path:
                return output_path
            else:
                buffer.seek(0)
                return buffer

        except Exception as e:
            logger.error(f"Failed to create PDF from images: {e}")
            raise


# Singleton instance
pdf_screenshot_service = PDFScreenshotService()
