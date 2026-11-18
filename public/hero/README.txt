Landing-page character
======================

poster.webp     The source artwork (506x777; the art itself sits at x 30-441, y 46-777).
                Used as-is, with its forest background faded out at the edges.

character.png   OPTIONAL. Add this to replace the forest with the night sky properly.
                Make it from poster.webp with the background removed:
                  1. Open https://www.remove.bg (or Canva / Photoshop "Remove background").
                  2. Upload poster.webp.
                  3. Download the PNG at full size (it must stay 506x777 so the hair,
                     blade and water animations still line up).
                  4. Save it here as character.png.
                Then set HAS_CUTOUT to true in components/HeroScene.tsx.

Rights: whoever made this artwork owns it. Fine for a local prototype; before
publishing, make sure you have permission or swap in art you own.
