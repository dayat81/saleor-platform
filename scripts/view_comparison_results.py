#!/usr/bin/env python3
"""
Chat Widget Comparison Results Viewer
=====================================

This script provides a summary of the chat widget comparison results and 
opens the generated HTML reports in the browser.
"""

import os
import subprocess
import webbrowser
from pathlib import Path
from datetime import datetime

def main():
    """Display comparison results and open reports."""
    
    print("🖼️  Chat Widget Screenshot Comparison Results")
    print("=" * 50)
    
    screenshots_dir = Path("screenshots")
    
    if not screenshots_dir.exists():
        print("❌ No screenshots directory found.")
        print("💡 Run the screenshot comparison first:")
        print("   python3 screenshot_chat_comparison.py")
        return
    
    # Find all files
    png_files = list(screenshots_dir.glob("*.png"))
    html_files = list(screenshots_dir.glob("*.html"))
    
    print(f"📁 Found {len(png_files)} screenshot(s) and {len(html_files)} report(s)")
    print()
    
    # Group files by type
    storefront_screenshots = [f for f in png_files if 'storefront' in f.name]
    backoffice_screenshots = [f for f in png_files if 'backoffice' in f.name]
    comparison_screenshots = [f for f in png_files if 'comparison' in f.name]
    
    print("📱 Storefront Screenshots:")
    for f in sorted(storefront_screenshots):
        file_size = f.stat().st_size / 1024
        print(f"  📸 {f.name} ({file_size:.1f} KB)")
    
    print()
    print("🏢 Backoffice Screenshots:")
    for f in sorted(backoffice_screenshots):
        file_size = f.stat().st_size / 1024
        print(f"  📸 {f.name} ({file_size:.1f} KB)")
    
    print()
    print("📊 Comparison Images:")
    for f in sorted(comparison_screenshots):
        file_size = f.stat().st_size / 1024
        print(f"  🔄 {f.name} ({file_size:.1f} KB)")
    
    print()
    print("📄 HTML Reports:")
    for f in sorted(html_files):
        file_size = f.stat().st_size / 1024
        print(f"  📝 {f.name} ({file_size:.1f} KB)")
    
    print()
    print("🔍 Quick Analysis:")
    
    # Check if both apps have screenshots
    has_storefront = len(storefront_screenshots) > 0
    has_backoffice = len(backoffice_screenshots) > 0
    
    if has_storefront and has_backoffice:
        print("  ✅ Both storefront and backoffice screenshots captured")
    elif has_storefront:
        print("  ⚠️  Only storefront screenshots captured")
    elif has_backoffice:
        print("  ⚠️  Only backoffice screenshots captured")
    else:
        print("  ❌ No screenshots captured")
    
    # Check for interaction screenshots
    interaction_files = [f for f in png_files if 'interaction' in f.name]
    opened_files = [f for f in png_files if 'opened' in f.name]
    
    if interaction_files:
        print(f"  ✅ Chat interaction screenshots captured ({len(interaction_files)})")
    elif opened_files:
        print(f"  ⚠️  Chat opened but no interaction captured ({len(opened_files)})")
    else:
        print("  ❌ No chat widget interactions captured")
    
    print()
    
    # Offer to open reports
    if html_files:
        latest_report = max(html_files, key=lambda f: f.stat().st_mtime)
        print(f"📖 Latest report: {latest_report.name}")
        
        response = input("🌐 Open the latest HTML report in browser? (y/N): ").lower().strip()
        if response in ['y', 'yes']:
            try:
                # Try to open with default browser
                file_url = f"file://{latest_report.absolute()}"
                webbrowser.open(file_url)
                print(f"✅ Opened: {file_url}")
            except Exception as e:
                print(f"❌ Failed to open browser: {e}")
                print(f"💡 Manually open: {latest_report.absolute()}")
    
    print()
    print("📂 All files are in:", screenshots_dir.absolute())
    print()
    print("🔄 To capture new screenshots:")
    print("   python3 screenshot_chat_comparison.py")
    print("   python3 quick_screenshot.py")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⏹️  Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")