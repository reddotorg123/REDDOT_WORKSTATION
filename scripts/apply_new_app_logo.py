import os
import io
import time
import base64
import math
from PIL import Image

def process_app_icon():
    source_path = r'C:/Users/jagad/.gemini/antigravity/brain/504041b2-775d-4dcf-a753-ee0c47a093fa/.user_uploaded/media_1793247809149_0984b371.jpg'
    artifact_dir = r'C:/Users/jagad/.gemini/antigravity/brain/504041b2-775d-4dcf-a753-ee0c47a093fa'
    
    if not os.path.exists(source_path):
        raise FileNotFoundError(f"Source image not found at {source_path}")

    print("Opening source image:", source_path)
    src = Image.open(source_path).convert('RGBA')
    w, h = src.size

    # Source squircle center is at (511.5, 511.5)
    # Target size: 1024 x 1024
    cx, cy = 511.5, 511.5
    a, b = 468.0, 468.0
    p = 4.3
    sub = 4
    inv_sub2 = 1.0 / (sub * sub)

    print(f"Generating mathematically continuous superellipse mask (p={p}, a={a}, b={b}, subpixels={sub}x{sub})...")
    mask = Image.new('L', (w, h), 0)
    pixels = mask.load()

    sub_offsets = [(s + 0.5) / sub for s in range(sub)]

    # 8-fold symmetric computation for instant sub-second vector precision
    for ix in range(512):
        dx_base = ix + 0.5
        for iy in range(ix + 1):
            dy_base = iy + 0.5
            
            min_val = (ix / a)**p + (iy / b)**p
            max_val = ((ix + 1) / a)**p + ((iy + 1) / b)**p
            
            if max_val <= 1.0:
                val = 255
            elif min_val > 1.0:
                val = 0
            else:
                count = 0
                for sy in sub_offsets:
                    y_p = ((dy_base + sy - 0.5) / b) ** p
                    for sx in sub_offsets:
                        if ((dx_base + sx - 0.5) / a) ** p + y_p <= 1.0:
                            count += 1
                val = int(round(count * 255 * inv_sub2))
                
            if val > 0:
                for x_coord, y_coord in [
                    (511 - ix, 511 - iy), (512 + ix, 511 - iy), (511 - ix, 512 + iy), (512 + ix, 512 + iy),
                    (511 - iy, 511 - ix), (512 + iy, 511 - ix), (511 - iy, 512 + ix), (512 + iy, 512 + ix)
                ]:
                    pixels[x_coord, y_coord] = val

    # Composite cleanly onto transparent canvas
    canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    icon_1024 = Image.composite(src, canvas, mask)

    # Save preview in artifact directory
    preview_path = os.path.join(artifact_dir, 'new_app_icon.png')
    icon_1024.save(preview_path, format='PNG')
    print(f"Saved artifact preview to: {preview_path}")

    # Prepare SVG with embedded base64 PNG
    buffer = io.BytesIO()
    icon_1024.save(buffer, format='PNG')
    b64_png = base64.b64encode(buffer.getvalue()).decode('utf-8')
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_png}" width="1024" height="1024" />
</svg>'''

    targets = [
        'assets',
        'wallpaper-ui/assets',
        'react-app/public/assets',
        'app/v3.5.2/.icon-ico',
        'react-app/dist/assets',
        'app/v3.5.2/REDDOT-Workstation-OS-win32-x64/resources/app/wallpaper-ui/assets'
    ]

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    for rel_target in targets:
        target_dir = os.path.join(base_dir, rel_target)
        if not os.path.exists(target_dir):
            if 'app/v3.5.2' in rel_target or 'react-app/dist' in rel_target:
                parent = os.path.dirname(target_dir)
                if not os.path.exists(parent):
                    continue
            os.makedirs(target_dir, exist_ok=True)

        png_path = os.path.join(target_dir, 'icon.png')
        ico_path = os.path.join(target_dir, 'icon.ico')
        fav_path = os.path.join(target_dir, 'favicon.ico')

        icon_1024.save(png_path, format='PNG')
        icon_1024.save(
            ico_path,
            format='ICO',
            sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
        )
        icon_1024.save(
            fav_path,
            format='ICO',
            sizes=[(64, 64), (32, 32), (16, 16)]
        )
        print(f"Updated icon assets in: {target_dir}")

    svg_dirs = [
        'assets',
        'wallpaper-ui',
        'react-app/public'
    ]
    for rel_svg in svg_dirs:
        svg_dir = os.path.join(base_dir, rel_svg)
        os.makedirs(svg_dir, exist_ok=True)
        with open(os.path.join(svg_dir, 'icon.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_content)
        with open(os.path.join(svg_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Updated SVG assets in: {svg_dir}")

    print("App icon regeneration with natural continuous curved squircle completed successfully!")

if __name__ == '__main__':
    process_app_icon()
