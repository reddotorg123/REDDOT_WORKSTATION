from PIL import Image
import os

img_path = r'C:\Users\jagad\.gemini\antigravity-ide\brain\d90f0eb5-a1ca-4810-93bb-55ce4ea8bbfc\.user_uploaded\media_1789294230200.png'
img = Image.open(img_path)
w, h = img.size
print(f"User image size: {w}x{h}")

# Let's check horizontal slices to find where colors change
# In particular, around the pink area
for y in range(0, h, 20):
    row_colors = [img.getpixel((x, y)) for x in range(0, w, 10)]
    # check if any pixel is pinkish (high R, medium G, medium B)
    has_pink = any(r > 240 and g > 200 and b > 200 and r > g + 10 for r, g, b, *rest in row_colors)
    if has_pink:
        print(f"Pink detected around y={y}")
