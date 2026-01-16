#!/usr/bin/env python3
"""
Quick script to convert SVG icons to PNG for Chrome extension
Requires: pip install cairosvg pillow
"""

try:
    import cairosvg
    import os
    
    print("🎨 Converting SVG icons to PNG...\n")
    
    # Convert each SVG to PNG
    sizes = [16, 48, 128]
    
    for size in sizes:
        svg_file = f"icon{size}.svg"
        png_file = f"icon{size}.png"
        
        if os.path.exists(svg_file):
            cairosvg.svg2png(url=svg_file, write_to=png_file, output_width=size, output_height=size)
            print(f"✅ Created {png_file} ({size}x{size})")
        else:
            print(f"❌ {svg_file} not found!")
    
    print("\n✨ All icons converted successfully!")
    
except ImportError:
    print("❌ Missing required library!")
    print("\nInstall it with:")
    print("  pip install cairosvg")
    print("\nOr use the HTML converter: convert-svg-to-png.html")
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nAlternative: Use the HTML converter (convert-svg-to-png.html)")

