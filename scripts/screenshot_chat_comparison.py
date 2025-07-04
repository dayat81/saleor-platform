#!/usr/bin/env python3
"""
Chat GUI Screenshot Comparison Script
=====================================

This script automatically captures screenshots of both storefront and backoffice 
chat widgets and creates a side-by-side comparison image.

Requirements:
- Python 3.8+
- selenium
- pillow (PIL)
- webdriver-manager

Usage:
    python3 screenshot_chat_comparison.py [--output-dir screenshots]
"""

import os
import sys
import time
import argparse
from datetime import datetime
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.action_chains import ActionChains
    from webdriver_manager.chrome import ChromeDriverManager
    from selenium.webdriver.chrome.service import Service
    from PIL import Image, ImageDraw, ImageFont
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Install with: pip install selenium pillow webdriver-manager")
    sys.exit(1)


class ChatScreenshotComparator:
    """Automated screenshot tool for chat widget comparison."""
    
    def __init__(self, output_dir="screenshots"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # URLs to test
        self.storefront_url = "http://storefront-dev.aksa.ai/"
        self.backoffice_url = "http://backoffice-dev.aksa.ai/"
        
        # Screenshot settings
        self.window_width = 1920
        self.window_height = 1080
        self.chat_wait_time = 3
        self.interaction_delay = 1
        
        # Initialize Chrome options
        self.chrome_options = self._setup_chrome_options()
        
    def _setup_chrome_options(self):
        """Configure Chrome browser options for screenshot capture."""
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-plugins")
        options.add_argument("--disable-images")  # Faster loading
        options.add_argument(f"--window-size={self.window_width},{self.window_height}")
        
        # Enable logging for debugging
        options.add_argument("--enable-logging")
        options.add_argument("--v=1")
        
        return options
    
    def _create_driver(self):
        """Create and configure Chrome WebDriver."""
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=self.chrome_options)
            driver.set_window_size(self.window_width, self.window_height)
            return driver
        except Exception as e:
            print(f"Failed to create WebDriver: {e}")
            raise
    
    def _wait_for_page_load(self, driver, timeout=30):
        """Wait for page to fully load."""
        try:
            WebDriverWait(driver, timeout).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            time.sleep(2)  # Additional wait for React/Next.js hydration
        except Exception as e:
            print(f"Page load timeout: {e}")
    
    def _capture_chat_widget(self, driver, app_name, url):
        """Capture screenshots of chat widget in different states."""
        print(f"📸 Capturing {app_name} chat widget at {url}")
        
        try:
            # Navigate to the page
            driver.get(url)
            self._wait_for_page_load(driver)
            
            screenshots = {}
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # 1. Initial state (chat button visible)
            print(f"  📋 Capturing initial state...")
            time.sleep(self.chat_wait_time)
            initial_screenshot = f"{app_name}_initial_{timestamp}.png"
            driver.save_screenshot(str(self.output_dir / initial_screenshot))
            screenshots['initial'] = initial_screenshot
            
            # 2. Try to find and click chat button with improved selectors
            chat_selectors = [
                "[data-testid='chat-button']",  # Primary selector with test ID
                "button[aria-label*='chat']",
                "button.chat-toggle-button",
                "button[class*='chat']",
                ".chat-widget button",
                "button:has(.h-6.w-6)",  # Icon button
                "button[class*='MessageCircle']",
                "button[class*='bg-blue-600']",  # Blue button styling
                "button[class*='rounded-full']",  # Round button styling
            ]
            
            chat_button = None
            for selector in chat_selectors:
                try:
                    chat_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    print(f"  ✅ Found chat button with selector: {selector}")
                    break
                except:
                    continue
            
            if not chat_button:
                # Try to find button by position (bottom-right corner)
                try:
                    buttons = driver.find_elements(By.TAG_NAME, "button")
                    for button in buttons:
                        location = button.location
                        if location['x'] > self.window_width - 200 and location['y'] > self.window_height - 200:
                            chat_button = button
                            print(f"  ✅ Found chat button by position")
                            break
                except:
                    pass
            
            if chat_button:
                # 3. Click chat button to open widget
                print(f"  🖱️  Opening chat widget...")
                ActionChains(driver).move_to_element(chat_button).click().perform()
                time.sleep(self.interaction_delay)
                
                # 4. Capture opened chat widget
                print(f"  📋 Capturing opened chat widget...")
                opened_screenshot = f"{app_name}_opened_{timestamp}.png"
                driver.save_screenshot(str(self.output_dir / opened_screenshot))
                screenshots['opened'] = opened_screenshot
                
                # 5. Try to interact with chat (send a test message)
                try:
                    input_selectors = [
                        "[data-testid='chat-input']",  # Primary selector with test ID
                        "input[placeholder*='message']",
                        "input[placeholder*='pesan']",
                        "input[aria-label*='message']",
                        "textarea[placeholder*='message']",
                        "input[type='text']",
                        ".chat-input input"
                    ]
                    
                    chat_input = None
                    for selector in input_selectors:
                        try:
                            chat_input = driver.find_element(By.CSS_SELECTOR, selector)
                            break
                        except:
                            continue
                    
                    if chat_input:
                        print(f"  ⌨️  Sending test message...")
                        test_message = "halo"
                        chat_input.clear()
                        chat_input.send_keys(test_message)
                        time.sleep(0.5)
                        
                        # Try to find and click send button
                        send_selectors = [
                            "[data-testid='chat-send-button']",  # Primary selector with test ID
                            "button[type='submit']",
                            "button:has(.Send)",
                            "button[aria-label*='send']",
                            ".chat-input button",
                            "button[class*='send']",
                            "button[class*='bg-blue-600']:not([data-testid='chat-button'])"
                        ]
                        
                        for selector in send_selectors:
                            try:
                                send_button = driver.find_element(By.CSS_SELECTOR, selector)
                                send_button.click()
                                break
                            except:
                                continue
                        
                        # Wait for response
                        time.sleep(3)
                        
                        # 6. Capture chat with interaction
                        print(f"  📋 Capturing chat with interaction...")
                        interaction_screenshot = f"{app_name}_interaction_{timestamp}.png"
                        driver.save_screenshot(str(self.output_dir / interaction_screenshot))
                        screenshots['interaction'] = interaction_screenshot
                
                except Exception as e:
                    print(f"  ⚠️  Could not interact with chat: {e}")
            
            else:
                print(f"  ⚠️  Could not find chat button")
                
        except Exception as e:
            print(f"  ❌ Error capturing {app_name}: {e}")
            # Take emergency screenshot
            emergency_screenshot = f"{app_name}_error_{timestamp}.png"
            try:
                driver.save_screenshot(str(self.output_dir / emergency_screenshot))
                screenshots['error'] = emergency_screenshot
            except:
                pass
        
        return screenshots
    
    def _create_comparison_image(self, storefront_screenshots, backoffice_screenshots):
        """Create side-by-side comparison images."""
        print("🎨 Creating comparison images...")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Get the most relevant screenshots for comparison
        comparison_pairs = []
        
        # Initial state comparison
        if 'initial' in storefront_screenshots and 'initial' in backoffice_screenshots:
            comparison_pairs.append(('initial', storefront_screenshots['initial'], backoffice_screenshots['initial']))
        
        # Opened state comparison
        if 'opened' in storefront_screenshots and 'opened' in backoffice_screenshots:
            comparison_pairs.append(('opened', storefront_screenshots['opened'], backoffice_screenshots['opened']))
        
        # Interaction state comparison
        if 'interaction' in storefront_screenshots and 'interaction' in backoffice_screenshots:
            comparison_pairs.append(('interaction', storefront_screenshots['interaction'], backoffice_screenshots['interaction']))
        
        comparison_files = []
        
        for state, storefront_file, backoffice_file in comparison_pairs:
            try:
                # Load images
                storefront_img = Image.open(self.output_dir / storefront_file)
                backoffice_img = Image.open(self.output_dir / backoffice_file)
                
                # Calculate dimensions for side-by-side layout
                max_width = max(storefront_img.width, backoffice_img.width)
                max_height = max(storefront_img.height, backoffice_img.height)
                
                # Create comparison image
                comparison_width = max_width * 2 + 60  # 60px for labels and spacing
                comparison_height = max_height + 100  # 100px for title and labels
                
                comparison_img = Image.new('RGB', (comparison_width, comparison_height), 'white')
                
                # Paste images side by side
                comparison_img.paste(storefront_img, (30, 80))
                comparison_img.paste(backoffice_img, (max_width + 30, 80))
                
                # Add labels and title
                draw = ImageDraw.Draw(comparison_img)
                
                try:
                    # Try to use a nice font
                    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
                    label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
                except:
                    # Fallback to default font
                    title_font = ImageFont.load_default()
                    label_font = ImageFont.load_default()
                
                # Draw title
                title = f"Chat Widget Comparison - {state.title()} State"
                title_bbox = draw.textbbox((0, 0), title, font=title_font)
                title_x = (comparison_width - (title_bbox[2] - title_bbox[0])) // 2
                draw.text((title_x, 20), title, fill='black', font=title_font)
                
                # Draw labels
                draw.text((30, 50), "Storefront", fill='blue', font=label_font)
                draw.text((max_width + 30, 50), "Backoffice", fill='green', font=label_font)
                
                # Add dividing line
                line_x = max_width + 15
                draw.line([(line_x, 80), (line_x, comparison_height - 20)], fill='gray', width=2)
                
                # Save comparison image
                comparison_filename = f"comparison_{state}_{timestamp}.png"
                comparison_img.save(self.output_dir / comparison_filename)
                comparison_files.append(comparison_filename)
                
                print(f"  ✅ Created: {comparison_filename}")
                
            except Exception as e:
                print(f"  ❌ Error creating {state} comparison: {e}")
        
        return comparison_files
    
    def _generate_report(self, storefront_screenshots, backoffice_screenshots, comparison_files):
        """Generate HTML report with all screenshots."""
        print("📝 Generating HTML report...")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Widget Comparison Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            text-align: center;
            margin-bottom: 10px;
        }}
        .timestamp {{
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }}
        .section {{
            margin-bottom: 40px;
        }}
        .section h2 {{
            color: #444;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }}
        .screenshot-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .screenshot-item {{
            text-align: center;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
        }}
        .screenshot-item img {{
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
            border-radius: 4px;
        }}
        .screenshot-item h3 {{
            margin: 15px 0 5px 0;
            color: #555;
        }}
        .comparison-section {{
            text-align: center;
        }}
        .comparison-section img {{
            max-width: 100%;
            height: auto;
            border: 2px solid #333;
            border-radius: 8px;
            margin-bottom: 20px;
        }}
        .status {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }}
        .status.success {{
            background-color: #d4edda;
            color: #155724;
        }}
        .status.warning {{
            background-color: #fff3cd;
            color: #856404;
        }}
        .urls {{
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }}
        .urls h3 {{
            margin-top: 0;
        }}
        .url-item {{
            margin: 5px 0;
        }}
        .url-item strong {{
            color: #333;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Chat Widget Comparison Report</h1>
        <div class="timestamp">Generated on: {timestamp}</div>
        
        <div class="urls">
            <h3>📍 URLs Tested</h3>
            <div class="url-item"><strong>Storefront:</strong> {self.storefront_url}</div>
            <div class="url-item"><strong>Backoffice:</strong> {self.backoffice_url}</div>
        </div>
        
        <div class="section comparison-section">
            <h2>📊 Side-by-Side Comparisons</h2>
"""
        
        # Add comparison images
        for comparison_file in comparison_files:
            html_content += f"""
            <div>
                <img src="{comparison_file}" alt="Chat Comparison">
            </div>
"""
        
        html_content += """
        </div>
        
        <div class="section">
            <h2>📱 Individual Screenshots</h2>
            <div class="screenshot-grid">
"""
        
        # Add individual screenshots
        all_screenshots = [
            ("Storefront", storefront_screenshots),
            ("Backoffice", backoffice_screenshots)
        ]
        
        for app_name, screenshots in all_screenshots:
            for state, filename in screenshots.items():
                status_class = "success" if state != "error" else "warning"
                html_content += f"""
                <div class="screenshot-item">
                    <h3>{app_name} - {state.title()} <span class="status {status_class}">{state}</span></h3>
                    <img src="{filename}" alt="{app_name} {state}">
                </div>
"""
        
        html_content += """
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Summary</h2>
            <p>This report shows the chat widget implementations in both the storefront and backoffice applications.</p>
            <ul>
                <li><strong>Initial State:</strong> Shows the chat button before interaction</li>
                <li><strong>Opened State:</strong> Shows the chat widget after clicking the button</li>
                <li><strong>Interaction State:</strong> Shows the chat widget with a test message sent</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""
        
        report_filename = f"chat_comparison_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        report_path = self.output_dir / report_filename
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"  ✅ Created: {report_filename}")
        return report_filename
    
    def run_comparison(self):
        """Execute the complete screenshot comparison process."""
        print("🚀 Starting Chat Widget Screenshot Comparison")
        print(f"📁 Output directory: {self.output_dir}")
        
        storefront_screenshots = {}
        backoffice_screenshots = {}
        
        # Create WebDriver
        driver = self._create_driver()
        
        try:
            # Capture storefront screenshots
            storefront_screenshots = self._capture_chat_widget(
                driver, "storefront", self.storefront_url
            )
            
            # Wait between captures
            time.sleep(2)
            
            # Capture backoffice screenshots
            backoffice_screenshots = self._capture_chat_widget(
                driver, "backoffice", self.backoffice_url
            )
            
        finally:
            driver.quit()
        
        # Create comparison images
        comparison_files = self._create_comparison_image(
            storefront_screenshots, backoffice_screenshots
        )
        
        # Generate HTML report
        report_file = self._generate_report(
            storefront_screenshots, backoffice_screenshots, comparison_files
        )
        
        print("\n✅ Screenshot comparison completed!")
        print(f"📁 Files saved to: {self.output_dir}")
        print(f"📄 Report: {report_file}")
        
        return {
            'storefront': storefront_screenshots,
            'backoffice': backoffice_screenshots,
            'comparisons': comparison_files,
            'report': report_file
        }


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Capture and compare chat widget screenshots"
    )
    parser.add_argument(
        "--output-dir",
        default="screenshots",
        help="Directory to save screenshots (default: screenshots)"
    )
    parser.add_argument(
        "--storefront-url",
        default="http://storefront-dev.aksa.ai/",
        help="Storefront URL to test"
    )
    parser.add_argument(
        "--backoffice-url", 
        default="http://backoffice-dev.aksa.ai/",
        help="Backoffice URL to test"
    )
    
    args = parser.parse_args()
    
    # Create and run comparison
    comparator = ChatScreenshotComparator(args.output_dir)
    
    # Override URLs if provided
    if args.storefront_url:
        comparator.storefront_url = args.storefront_url
    if args.backoffice_url:
        comparator.backoffice_url = args.backoffice_url
    
    try:
        results = comparator.run_comparison()
        return 0
    except Exception as e:
        print(f"❌ Error during comparison: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())