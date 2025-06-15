#!/usr/bin/env python3
"""
Essay Generator for Chaitanya's Website
Converts markdown essays from Decap CMS to HTML using the template
"""

import os
import re
import yaml
from datetime import datetime
from pathlib import Path

def parse_frontmatter(content):
    """Parse YAML frontmatter from markdown content"""
    if content.startswith('---'):
        try:
            end = content.find('---', 3)
            if end != -1:
                frontmatter = yaml.safe_load(content[3:end])
                body = content[end + 3:].strip()
                return frontmatter, body
        except yaml.YAMLError:
            pass
    return {}, content

def markdown_to_html(text):
    """Convert basic markdown to HTML"""
    # Headers
    text = re.sub(r'^### (.*$)', r'<h3>\1</h3>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.*$)', r'<h3>\1</h3>', text, flags=re.MULTILINE)  # Using h3 for consistency
    text = re.sub(r'^# (.*$)', r'<h3>\1</h3>', text, flags=re.MULTILINE)   # Using h3 for consistency
    
    # Bold and italic
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    
    # Links
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', text)
    
    # Paragraphs
    paragraphs = text.split('\n\n')
    html_paragraphs = []
    for p in paragraphs:
        p = p.strip()
        if p and not p.startswith('<'):
            p = f'<p>{p}</p>'
        if p:
            html_paragraphs.append(p)
    
    return '\n\n      '.join(html_paragraphs)

def create_slug(title):
    """Create URL-friendly slug from title"""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def generate_html_from_markdown():
    """Generate HTML files from markdown essays"""
    essays_dir = Path('essays')
    template_path = Path('templates/essay-template.html')
    
    if not template_path.exists():
        print("Template file not found!")
        return
    
    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()
    
    # Process each markdown file
    for md_file in essays_dir.glob('*.md'):
        print(f"Processing {md_file.name}...")
        
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse frontmatter and content
        frontmatter, body = parse_frontmatter(content)
        
        title = frontmatter.get('title', 'Untitled')
        description = frontmatter.get('description', '')
        date_obj = frontmatter.get('date')
        
        if isinstance(date_obj, datetime):
            date_str = date_obj.strftime('%Y-%m-%d')
            date_readable = date_obj.strftime('%B %d, %Y')
        else:
            date_str = str(date_obj) if date_obj else datetime.now().strftime('%Y-%m-%d')
            date_readable = datetime.now().strftime('%B %d, %Y')
        
        slug = create_slug(title)
        
        # Convert markdown to HTML
        html_content = markdown_to_html(body)
        
        # Replace template placeholders
        html_output = template
        html_output = html_output.replace('ESSAY_TITLE', title)
        html_output = html_output.replace('ESSAY_DESCRIPTION', description)
        html_output = html_output.replace('ESSAY_SLUG', slug)
        html_output = html_output.replace('YYYY-MM-DD', date_str)
        html_output = html_output.replace('DATE_WRITTEN', date_readable)
        html_output = html_output.replace('ESSAY_CONTENT_GOES_HERE', html_content)
        
        # Write HTML file
        html_file = essays_dir / f'{slug}.html'
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_output)
        
        print(f"Generated {html_file}")

def update_essays_index():
    """Update the essays.html file with new essays"""
    essays_dir = Path('essays')
    essays_html = Path('essays.html')
    
    # Get all HTML essays (excluding template)
    essay_files = []
    for html_file in essays_dir.glob('*.html'):
        if html_file.name != 'essay-template.html':
            essay_files.append(html_file)
    
    # Sort by modification time (newest first)
    essay_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    
    print(f"Found {len(essay_files)} essays to list")

if __name__ == "__main__":
    print("Generating essays from markdown...")
    generate_html_from_markdown()
    update_essays_index()
    print("Done!") 