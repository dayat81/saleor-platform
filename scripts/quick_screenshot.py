#!/usr/bin/env python3
"""
Quick Chat Screenshot Tool
==========================

A lightweight script to capture chat widget screenshots using basic tools.
This version uses curl to check if sites are accessible and generates a simple comparison.
"""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

def check_url_accessibility(url):
    """Check if URL is accessible."""
    try:
        result = subprocess.run(
            ['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', url],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0 and result.stdout.strip() == '200'
    except:
        return False

def capture_with_wkhtmltopdf(url, output_file):
    """Capture screenshot using wkhtmltopdf if available."""
    try:
        cmd = [
            'wkhtmltoimage',
            '--width', '1920',
            '--height', '1080',
            '--javascript-delay', '3000',
            '--load-error-handling', 'ignore',
            '--crop-w', '1920',
            '--crop-h', '1080',
            url,
            output_file
        ]
        
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return result.returncode == 0
    except:
        return False

def capture_with_cutycapt(url, output_file):
    """Capture screenshot using CutyCapt if available."""
    try:
        cmd = [
            'cutycapt',
            '--url=' + url,
            '--out=' + output_file,
            '--min-width=1920',
            '--min-height=1080',
            '--delay=3000'
        ]
        
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        return result.returncode == 0
    except:
        return False

def capture_with_firefox_headless(url, output_file):
    """Capture screenshot using Firefox headless mode."""
    try:
        # Create a simple HTML file that loads the URL in an iframe
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ margin: 0; padding: 0; }}
        iframe {{ width: 100vw; height: 100vh; border: none; }}
    </style>
</head>
<body>
    <iframe src="{url}"></iframe>
</body>
</html>
"""
        
        temp_html = f"/tmp/capture_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(temp_html, 'w') as f:
            f.write(html_content)
        
        cmd = [
            'firefox',
            '--headless',
            '--window-size=1920,1080',
            '--screenshot=' + output_file,
            'file://' + temp_html
        ]
        
        result = subprocess.run(cmd, capture_output=True, timeout=30)
        
        # Clean up temp file
        try:
            os.unlink(temp_html)
        except:
            pass
            
        return result.returncode == 0
    except:
        return False

def generate_comparison_report():
    """Generate a simple comparison report."""
    
    output_dir = Path("screenshots")
    output_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    urls = {
        'storefront': 'http://storefront-dev.aksa.ai/',
        'backoffice': 'http://backoffice-dev.aksa.ai/'
    }
    
    results = {}
    
    print("🔍 Quick Chat Widget Screenshot Comparison")
    print("==========================================")
    
    # Check URL accessibility
    for name, url in urls.items():
        print(f"🌐 Checking {name}: {url}")
        if check_url_accessibility(url):
            print(f"  ✅ {name} is accessible")
            results[name] = {'url': url, 'accessible': True}
        else:
            print(f"  ❌ {name} is not accessible")
            results[name] = {'url': url, 'accessible': False}
    
    # Try different screenshot methods
    screenshot_tools = [
        ('wkhtmltoimage', capture_with_wkhtmltopdf),
        ('cutycapt', capture_with_cutycapt),
        ('firefox --headless', capture_with_firefox_headless)
    ]
    
    successful_captures = {}
    
    for tool_name, capture_func in screenshot_tools:
        print(f"\n📸 Trying to capture screenshots with {tool_name}...")
        
        if not any(results[name]['accessible'] for name in results):
            print("  ⏭️  Skipping - no accessible URLs")
            continue
        
        tool_success = False
        
        for name, info in results.items():
            if not info['accessible']:
                continue
                
            output_file = str(output_dir / f"{name}_{tool_name.replace(' ', '_')}_{timestamp}.png")
            
            print(f"  📱 Capturing {name}...")
            
            if capture_func(info['url'], output_file):
                print(f"    ✅ Success: {output_file}")
                successful_captures[name] = output_file
                tool_success = True
            else:
                print(f"    ❌ Failed")
        
        if tool_success:
            print(f"  🎉 Successfully captured with {tool_name}")
            break
    
    # Generate HTML report
    if successful_captures:
        generate_html_report(successful_captures, results, timestamp, output_dir)
    else:
        print("\n❌ No screenshots could be captured")
        print("💡 Try installing one of these tools:")
        print("   sudo apt-get install wkhtmltopdf")
        print("   sudo apt-get install cutycapt")
        print("   sudo apt-get install firefox")
    
    return successful_captures

def generate_html_report(captures, results, timestamp, output_dir):
    """Generate simple HTML report."""
    
    report_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Chat Widget Comparison - {timestamp}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }}
        h1 {{ text-align: center; color: #333; }}
        .timestamp {{ text-align: center; color: #666; margin-bottom: 30px; }}
        .comparison {{ display: flex; gap: 20px; margin-bottom: 30px; }}
        .screenshot {{ flex: 1; text-align: center; }}
        .screenshot img {{ max-width: 100%; border: 2px solid #ddd; border-radius: 4px; }}
        .screenshot h3 {{ margin-bottom: 10px; }}
        .url-info {{ background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }}
        .status.ok {{ color: green; }}
        .status.error {{ color: red; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Chat Widget Comparison</h1>
        <div class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
        
        <div class="url-info">
            <h3>📍 URLs Tested</h3>
"""
    
    for name, info in results.items():
        status_class = "ok" if info['accessible'] else "error"
        status_text = "✅ Accessible" if info['accessible'] else "❌ Not Accessible"
        
        report_content += f"""
            <p><strong>{name.title()}:</strong> {info['url']} 
               <span class="status {status_class}">{status_text}</span></p>
"""
    
    report_content += """
        </div>
        
        <div class="comparison">
"""
    
    for name, screenshot_file in captures.items():
        filename = os.path.basename(screenshot_file)
        report_content += f"""
            <div class="screenshot">
                <h3>{name.title()} Chat Widget</h3>
                <img src="{filename}" alt="{name} screenshot">
            </div>
"""
    
    report_content += """
        </div>
        
        <div class="notes">
            <h3>📝 Notes</h3>
            <ul>
                <li>Screenshots captured with automated tools</li>
                <li>May not show interactive states (opened chat widgets)</li>
                <li>For detailed chat widget testing, use the full Selenium script</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""
    
    report_file = output_dir / f"quick_comparison_report_{timestamp}.html"
    with open(report_file, 'w') as f:
        f.write(report_content)
    
    print(f"\n✅ Report generated: {report_file}")
    print(f"📁 Screenshots saved in: {output_dir}")

if __name__ == "__main__":
    try:
        captures = generate_comparison_report()
        if captures:
            print(f"\n🎉 Successfully captured {len(captures)} screenshots")
        else:
            print(f"\n💡 For full functionality, run: python3 screenshot_chat_comparison.py")
    except KeyboardInterrupt:
        print("\n⏹️  Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")