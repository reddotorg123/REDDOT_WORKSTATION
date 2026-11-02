import os
from PIL import Image, ImageDraw, ImageFont

def generate_stylish_r():
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base Squircle / Rounded Rectangle
    corner_radius = 110
    padding = 24
    box = [padding, padding, size - padding, size - padding]

    # Gradient fill from top-left to bottom-right
    # Deep red to crimson/ruby: #e11d48 to #881337
    c1 = (225, 29, 72, 255)
    c2 = (143, 10, 48, 255)

    base = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    b_draw = ImageDraw.Draw(base)
    b_draw.rounded_rectangle(box, radius=corner_radius, fill=(255, 255, 255, 255))

    # Create gradient mask
    for y in range(padding, size - padding):
        for x in range(padding, size - padding):
            if base.getpixel((x, y))[3] > 0:
                factor = ((x - padding) + (y - padding)) / float((size - 2 * padding) * 2)
                r = int(c1[0] + (c2[0] - c1[0]) * factor)
                g = int(c1[1] + (c2[1] - c1[1]) * factor)
                b = int(c1[2] + (c2[2] - c1[2]) * factor)
                img.putpixel((x, y), (r, g, b, 255))

    # Inner subtle highlight ring
    highlight_box = [padding + 6, padding + 6, size - padding - 6, size - padding - 6]
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(highlight_box, radius=corner_radius - 6, outline=(255, 255, 255, 45), width=3)

    # 2. Draw Geometric High-Tech "R"
    # Stem: vertical bar on the left
    stem_x0 = 150
    stem_x1 = 205
    stem_y0 = 135
    stem_y1 = 377
    draw.rounded_rectangle([stem_x0, stem_y0, stem_x1, stem_y1], radius=12, fill=(255, 255, 255, 255))

    # Top loop outer
    loop_box = [185, 135, 360, 265]
    draw.pieslice(loop_box, start=270, end=90, fill=(255, 255, 255, 255))
    draw.rectangle([185, 135, 272, 265], fill=(255, 255, 255, 255))

    # Top loop inner cut-out (showing crimson background)
    inner_loop_box = [190, 180, 310, 220]
    draw.pieslice([190, 175, 310, 225], start=270, end=90, fill=(180, 20, 60, 255))
    draw.rectangle([185, 175, 250, 225], fill=(180, 20, 60, 255))

    # Diagonal leg of R with rounded tip
    leg_points = [
        (230, 240),
        (280, 240),
        (370, 377),
        (315, 377)
    ]
    draw.polygon(leg_points, fill=(255, 255, 255, 255))
    draw.ellipse([315, 360, 370, 380], fill=(255, 255, 255, 255))

    # 3. Signature REDDOT Accent Dot in top right corner
    dot_center = (size - padding - 36, padding + 36)
    dot_radius = 24
    draw.ellipse(
        [dot_center[0] - dot_radius, dot_center[1] - dot_radius, dot_center[0] + dot_radius, dot_center[1] + dot_radius],
        fill=(255, 255, 255, 255)
    )
    draw.ellipse(
        [dot_center[0] - dot_radius + 4, dot_center[1] - dot_radius + 4, dot_center[0] + dot_radius - 4, dot_center[1] + dot_radius - 4],
        fill=(239, 68, 68, 255)
    )

    # Save to target directories
    targets = [
        'react-app/public/assets',
        'wallpaper-ui/assets',
        'app/v3.5.2/.icon-ico',
        'assets'
    ]

    for t in targets:
        os.makedirs(t, exist_ok=True)
        png_path = os.path.join(t, 'icon.png')
        ico_path = os.path.join(t, 'icon.ico')
        fav_path = os.path.join(t, 'favicon.ico')
        img.save(png_path, format='PNG')
        img.save(ico_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
        img.save(fav_path, format='ICO', sizes=[(64, 64), (32, 32), (16, 16)])
        print(f"Generated icon assets in {t}")

    # Generate matching SVG
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="reddotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e11d48"/>
      <stop offset="100%" stop-color="#881337"/>
    </linearGradient>
  </defs>
  <rect x="24" y="24" width="464" height="464" rx="110" fill="url(#reddotGrad)"/>
  <rect x="30" y="30" width="452" height="452" rx="104" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
  <!-- Stem -->
  <rect x="150" y="135" width="55" height="242" rx="12" fill="#FFFFFF"/>
  <!-- Loop -->
  <path d="M 185 135 L 272 135 A 65 65 0 0 1 272 265 L 185 265 Z" fill="#FFFFFF"/>
  <path d="M 185 175 L 250 175 A 25 25 0 0 1 250 225 L 185 225 Z" fill="#b4143c"/>
  <!-- Leg -->
  <polygon points="230,240 280,240 370,377 315,377" fill="#FFFFFF"/>
  <!-- Signature Dot -->
  <circle cx="452" cy="60" r="24" fill="#FFFFFF"/>
  <circle cx="452" cy="60" r="20" fill="#ef4444"/>
</svg>'''

    for svg_dir in ['react-app/public', 'wallpaper-ui', 'assets']:
        os.makedirs(svg_dir, exist_ok=True)
        with open(os.path.join(svg_dir, 'favicon.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_content)
        with open(os.path.join(svg_dir, 'icon.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Generated SVG in {svg_dir}")

if __name__ == '__main__':
    generate_stylish_r()
