import zlib
import struct
import math
import os

def create_png(width, height, get_pixel_func, output_path):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend((r, g, b, a))

    def make_chunk(chunk_type, data):
        length = len(data)
        crc = zlib.crc32(chunk_type + data) & 0xffffffff
        return struct.pack('>I', length) + chunk_type + data + struct.pack('>I', crc)

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(make_chunk(b'IHDR', ihdr_data))
    
    compressed_data = zlib.compress(bytes(raw_data), level=9)
    png.extend(make_chunk(b'IDAT', compressed_data))
    png.extend(make_chunk(b'IEND', b''))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(png)
    print(f"Generated {output_path} ({width}x{height})")

def audax_pixel_generator(is_maskable=False):
    def get_pixel(x, y, w, h):
        nx = (x / w) * 2 - 1.0  # -1 to 1
        ny = (y / h) * 2 - 1.0  # -1 to 1
        
        # Maskable safe-zone factor: scale emblem to stay in inner 75%
        scale = 0.75 if is_maskable else 0.88
        snx = nx / scale
        sny = ny / scale

        # Base background: deep obsidian gradient with warm amber undertone
        dist_center = math.sqrt(nx*nx + ny*ny)
        bg_r = int(max(18, 30 - dist_center * 15))
        bg_g = int(max(14, 25 - dist_center * 15))
        bg_b = int(max(12, 22 - dist_center * 15))
        alpha = 255

        # If outside scale, return background
        if abs(snx) > 1.0 or abs(sny) > 1.0:
            return (bg_r, bg_g, bg_b, alpha)

        # Scissor / Letter 'A' Emblem rendering
        # Diagonal lines for scissor arms: snx ~ sny and snx ~ -sny
        diag1 = abs(snx - sny * 0.9)
        diag2 = abs(snx + sny * 0.9)
        
        # Center circle pivot
        pivot_dist = math.sqrt(snx*snx + (sny - 0.05)*(sny - 0.05))
        
        # Crossbar of 'A'
        bar = (abs(sny - 0.15) < 0.04) and (abs(snx) < 0.28)
        
        # Upper legs of scissors/A
        scissor_arm = (diag1 < 0.08 or diag2 < 0.08) and (abs(sny) < 0.75)
        
        # Lower loops
        loop1_dist = math.sqrt((snx - 0.35)**2 + (sny - 0.55)**2)
        loop2_dist = math.sqrt((snx + 0.35)**2 + (sny - 0.55)**2)
        loop = (0.10 < loop1_dist < 0.18) or (0.10 < loop2_dist < 0.18)

        is_gold = scissor_arm or bar or (0.04 < pivot_dist < 0.10) or loop

        if is_gold:
            # Gold gradient from light gold at top to deep amber at bottom
            t = (sny + 1) / 2
            gr = int(253 * (1 - t) + 180 * t)
            gg = int(230 * (1 - t) + 115 * t)
            gb = int(138 * (1 - t) + 20 * t)
            return (min(255, gr + 20), min(255, gg + 15), min(255, gb), 255)

        if pivot_dist <= 0.04:
            return (bg_r, bg_g, bg_b, 255)

        # Subtle gold outer border
        if not is_maskable:
            edge_dist = max(abs(nx), abs(ny))
            if 0.92 < edge_dist < 0.96:
                return (217, 119, 6, 180)

        return (bg_r, bg_g, bg_b, alpha)
    return get_pixel

if __name__ == '__main__':
    public_dir = 'public'
    create_png(192, 192, audax_pixel_generator(is_maskable=False), f'{public_dir}/pwa-192x192.png')
    create_png(512, 512, audax_pixel_generator(is_maskable=False), f'{public_dir}/pwa-512x512.png')
    create_png(512, 512, audax_pixel_generator(is_maskable=True), f'{public_dir}/pwa-maskable-512x512.png')
    create_png(180, 180, audax_pixel_generator(is_maskable=False), f'{public_dir}/apple-touch-icon.png')
    # Favicon copy (192 or standard)
    create_png(64, 64, audax_pixel_generator(is_maskable=False), f'{public_dir}/favicon.ico')
    print("All PWA PNG assets created successfully.")
