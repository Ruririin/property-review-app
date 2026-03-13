"""
PDF Export Service for NeitClem In-Hub
Handles server-side PDF generation with multiple export options
"""

from io import BytesIO
import json
from pathlib import Path
from typing import List, Dict, Any
import base64

# PDF generation libraries
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib.units import inch

# Alternative: WeasyPrint for HTML-to-PDF (better for complex layouts)
# Disabled due to Windows compatibility issues - using ReportLab only
WEASYPRINT_AVAILABLE = False

from django.template.loader import render_to_string
from django.conf import settings
import os

class PropertyPDFExporter:
    """Handles PDF export for property review slides"""
    
    def __init__(self):
        self.page_width = 1280
        self.page_height = 720
        self.pdf_size = landscape(A4)
    
    def export_frontend_slides(self, slides_data: List[Dict], filename: str = "Property_Review.pdf") -> BytesIO:
        """
        Export slides from frontend data with proper positioning adjustments
        Handles StreetView and Interior websiteInfo field positioning
        """
        buffer = BytesIO()
        
        # Use Puppeteer-style approach with HTML/CSS for precise positioning
        return self._export_with_html_positioning(slides_data, filename, buffer)
    
    def _export_with_html_positioning(self, slides_data: List[Dict], filename: str, buffer: BytesIO) -> BytesIO:
        """Generate PDF with exact positioning using ReportLab with coordinate positioning"""
        
        return self._export_with_coordinate_positioning(slides_data, filename, buffer)
    
    def _export_with_position_adjustments(self, slides_data: List[Dict], filename: str, buffer: BytesIO) -> BytesIO:
        """Apply positioning adjustments for specific slide types"""
        
        for slide in slides_data:
            slide_type = slide.get('type', '')
            if slide_type in ['street_view', 'interior']:
                if 'formData' in slide and 'websiteInfo' in slide['formData']:
                    slide['_positioning'] = {
                        'websiteInfo': {
                            'adjustment': 'up_6_percent'
                        }
                    }
        
        return self.export_with_reportlab(slides_data, filename)
    
    def _export_with_coordinate_positioning(self, slides_data: List[Dict], filename: str, buffer: BytesIO) -> BytesIO:
        """Generate PDF using ReportLab with precise coordinate positioning"""
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.pdfbase import pdfutils
        
        c = canvas.Canvas(buffer, pagesize=(1280, 720))
        
        for i, slide in enumerate(slides_data):
            if i > 0:
                c.showPage()  # Start new page for each slide except first
            
            slide_type = slide.get('type', 'default')
            form_data = slide.get('formData', {})
            image_data = slide.get('imageData')
            image_position = slide.get('imagePosition', {})
            
            background_path = None
            if slide_type == 'street_view':
                background_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'Template', 'Template-04.png')
            elif slide_type == 'interior':
                background_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'Template', 'interior.png')
            elif slide_type == 'aerial':
                background_path = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public', 'Template', 'Template-02.png')
            
            if background_path and os.path.exists(background_path):
                try:
                    c.drawImage(background_path, 0, 0, width=1280, height=720)
                except Exception as e:
                    print(f"Could not load background image: {e}")
            
            c.setFont("Helvetica", 28)
            c.setFillColor(colors.Color(139/255, 154/255, 91/255))  # #8B9A5B
            
            for field_name, field_value in form_data.items():
                if field_value and field_value.strip():
                    if field_name == 'websiteInfo':
                        if slide_type in ['street_view', 'interior']:
                            x = 1280 - (1280 * 0.005)
                            y = 31.8

                            text_width = c.stringWidth(field_value, "Helvetica", 28)
                            x = x - text_width
                            
                            c.drawString(x, y, field_value)
                            print(f"Drew websiteInfo at coordinates: x={x}, y={y} (moved up 6%)")
                        else:
                            x = 1280 - (1280 * 0.005)
                            y = -11.4 + 720
                            text_width = c.stringWidth(field_value, "Helvetica", 28)
                            x = x - text_width
                            c.drawString(x, y, field_value)
                    
                    elif field_name == 'premiseLocation':
                        x = 1280 - (1280 * 0.012)
                        y = 720 - 670
                        
                        text_width = c.stringWidth(field_value, "Helvetica", 28)
                        x = x - text_width
                        
                        c.drawString(x, y, field_value)
            
            if image_data and image_data.startswith('data:image'):
                try:
                    img_str = image_data.split(',')[1]
                    img_bytes = base64.b64decode(img_str)
                    img = ImageReader(BytesIO(img_bytes))

                    x = image_position.get('x', 0)
                    y = 720 - image_position.get('y', 0) - image_position.get('height', 150)
                    width = image_position.get('width', 200)
                    height = image_position.get('height', 150)
                    
                    c.drawImage(img, x, y, width=width, height=height)
                except Exception as e:
                    print(f"Error drawing image: {e}")
        
        c.save()
        buffer.seek(0)
        return buffer

    def export_with_reportlab(self, slides_data: List[Dict], filename: str = "Property_Review.pdf") -> BytesIO:
        """Export slides to PDF using ReportLab"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=self.pdf_size,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch,
            leftMargin=0.5*inch,
            rightMargin=0.5*inch
        )
        
        story = []
        styles = getSampleStyleSheet()

        slide_style = ParagraphStyle(
            'SlideStyle',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            leftIndent=0,
        )
        
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=1,  # Center alignment
        )
        
        for i, slide in enumerate(slides_data):
            if i > 0:
                story.append(Spacer(1, 0.5*inch))

            title = slide.get('title', f'Slide {i + 1}')
            story.append(Paragraph(title, title_style))


            content = slide.get('content', {})
            for key, value in content.items():
                if isinstance(value, str) and value.strip():
                    story.append(Paragraph(f"<b>{key}:</b> {value}", slide_style))

            if 'images' in slide:
                for img_data in slide['images']:
                    try:
                        if 'data:image' in str(img_data):
                            img_str = img_data.split(',')[1]
                            img_bytes = base64.b64decode(img_str)
                            img = ImageReader(BytesIO(img_bytes))
                            story.append(Spacer(1, 12))
                            story.append(img)
                    except Exception as e:
                        print(f"Error processing image: {e}")
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def export_with_weasyprint(self, slides_data: List[Dict], filename: str = "Property_Review.pdf") -> BytesIO:
        """Export slides to PDF using WeasyPrint (HTML-to-PDF)"""
        if not WEASYPRINT_AVAILABLE:
            print("WeasyPrint not available, falling back to ReportLab")
            return self.export_with_reportlab(slides_data, filename)
        
        html_content = self._generate_html_for_slides(slides_data)

        css_content = """
        @page {
            size: 1280px 720px;
            margin: 0;
        }
        
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white;
        }
        
        .slide {
            width: 1240px;
            height: 680px;
            margin-bottom: 20px;
            padding: 20px;
            border: 1px solid #ddd;
            page-break-after: always;
            position: relative;
        }
        
        .slide:last-child {
            page-break-after: avoid;
        }
        
        .slide-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .slide-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            height: calc(100% - 60px);
        }
        
        .text-content {
            padding: 10px;
        }
        
        .text-field {
            margin-bottom: 15px;
        }
        
        .field-label {
            font-weight: bold;
            color: #333;
        }
        
        .field-value {
            margin-top: 5px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background: #f9f9f9;
        }
        
        .image-content {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            border-radius: 4px;
        }
        
        .slide-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        @media print {
            .slide {
                page-break-inside: avoid;
            }
        }
        """
        
        buffer = BytesIO()
        return buffer
    
    def _generate_html_for_slides(self, slides_data: List[Dict]) -> str:
        """Generate HTML template for slides"""
        html_parts = [
            '<!DOCTYPE html>',
            '<html><head><meta charset="utf-8"><title>Property Review</title></head><body>'
        ]
        
        for i, slide in enumerate(slides_data):
            title = slide.get('title', f'Slide {i + 1}')
            content = slide.get('content', {})
            images = slide.get('images', [])
            
            html_parts.append(f'<div class="slide">')
            html_parts.append(f'<h1 class="slide-title">{title}</h1>')
            html_parts.append('<div class="slide-content">')
            
            html_parts.append('<div class="text-content">')
            for key, value in content.items():
                if isinstance(value, str) and value.strip():
                    html_parts.append(f'''
                        <div class="text-field">
                            <div class="field-label">{key}</div>
                            <div class="field-value">{value}</div>
                        </div>
                    ''')
            html_parts.append('</div>')

            html_parts.append('<div class="image-content">')
            if images and len(images) > 0:
                img_src = images[0] if isinstance(images[0], str) else str(images[0])
                if img_src:
                    html_parts.append(f'<img src="{img_src}" class="slide-image" alt="Property Image"/>')
            html_parts.append('</div>')

            html_parts.append('</div>')
            html_parts.append('</div>')
        
        html_parts.append('</body></html>')
        return ''.join(html_parts)
    
    def _generate_positioned_html(self, slides_data: List[Dict]) -> str:
        """Generate HTML with exact positioning for frontend slides"""
        html_parts = [
            '<!DOCTYPE html>',
            '<html><head><meta charset="utf-8"><title>Property Review</title>',
            '<style>',
            '''
            @page {
                size: 1280px 720px;
                margin: 0;
            }
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Montserrat', sans-serif;
                background: white;
            }
            
            .slide {
                width: 1280px;
                height: 720px;
                position: relative;
                background-size: 100% 100%;
                page-break-after: always;
                overflow: hidden;
            }
            
            .slide:last-child {
                page-break-after: avoid;
            }
            
            .text-field {
                position: absolute;
                font-size: 28px;
                font-family: 'Montserrat', sans-serif;
                color: #8B9A5B;
                text-align: right;
                white-space: nowrap;
                padding: 4px 0px 4px 8px;
            }
            
            /* Specific positioning for websiteInfo on StreetView and Interior slides */
            .street-view .websiteInfo-field {
                bottom: 31.8px !important; /* -11.4px + 43.2px = 31.8px (moved up 6%) */
                right: 0.5%;
            }
            
            .interior .websiteInfo-field {
                bottom: 31.8px !important; /* -11.4px + 43.2px = 31.8px (moved up 6%) */
                right: 0.5%;
            }
            
            .premiseLocation-field {
                top: 670px;
                right: 1.2%;
            }
            
            .slide-image {
                position: absolute;
                max-width: 100%;
                max-height: 100%;
            }
            ''',
            '</style></head><body>'
        ]
        
        for i, slide in enumerate(slides_data):
            slide_type = slide.get('type', 'default')
            form_data = slide.get('formData', {})
            image_data = slide.get('imageData')
            image_position = slide.get('imagePosition', {})
            
            slide_class = 'slide'
            background_image = ''
            
            if slide_type == 'street_view':
                slide_class += ' street-view'
                background_image = '/Template/Template-04.png'
            elif slide_type == 'interior':
                slide_class += ' interior'
                background_image = '/Template/interior.png'
            elif slide_type == 'aerial':
                background_image = '/Template/Template-02.png'
            
            html_parts.append(f'<div class="{slide_class}" style="background-image: url(\'{background_image}\');">')

            for field_name, field_value in form_data.items():
                if field_value and field_value.strip():
                    field_class = f'{field_name}-field'

                    estimated_width = max(300, min(900, len(field_value) * 16 + 120))
                    
                    html_parts.append(f'''
                        <div class="text-field {field_class}" style="width: {estimated_width}px;">
                            {field_value}
                        </div>
                    ''')

            if image_data:
                x = image_position.get('x', 0)
                y = image_position.get('y', 0)
                width = image_position.get('width', 200)
                height = image_position.get('height', 150)
                
                html_parts.append(f'''
                    <img src="{image_data}" class="slide-image" 
                         style="left: {x}px; top: {y}px; width: {width}px; height: {height}px;" />
                ''')

            html_parts.append('</div>')
        
        html_parts.append('</body></html>')
        return ''.join(html_parts)
    
    def export_from_project(self, project_id: str, export_method: str = 'weasyprint') -> BytesIO:
        """Export slides from a Django project model"""
        from .models import Project
        
        try:
            project = Project.objects.get(id=project_id)
            slides = project.slides.all().order_by('slide_number')
            
            slides_data = []
            for slide in slides:
                slide_data = {
                    'title': slide.title or f'Slide {slide.slide_number}',
                    'content': slide.content,
                    'images': []
                }

                for img in slide.images.all():
                    if img.image and os.path.exists(img.image.path):
                        with open(img.image.path, 'rb') as f:
                            img_data = base64.b64encode(f.read()).decode()
                            img_type = img.image.name.split('.')[-1].lower()
                            img_src = f"data:image/{img_type};base64,{img_data}"
                            slide_data['images'].append(img_src)
                
                slides_data.append(slide_data)

            if export_method == 'reportlab':
                return self.export_with_reportlab(slides_data, f"{project.name}.pdf")
            else:
                return self.export_with_weasyprint(slides_data, f"{project.name}.pdf")
                
        except Project.DoesNotExist:
            raise ValueError(f"Project with ID {project_id} not found")
        except Exception as e:
            raise Exception(f"Error exporting PDF: {str(e)}")

# Initialize the service
pdf_exporter = PropertyPDFExporter()