# Portfolio Visual Assets — Claude Code Reference

This file is the visual-asset index for the portfolio redesign. Keep the original media files in the folders below; this Markdown file only documents them and tells Claude Code how to use them.

## Recommended folder structure

```text
portfolio/
├── CLAUDE.md
├── portfolio-project-memory.md
├── portfolio-redesign-master-prompt.md
└── references/
    ├── personal/
    │   └── about_page.png
    ├── brand/
    │   └── first_page_hero.png
    └── videos/
        ├── 5rules final v2.mp4
        ├── brand_campaign.mp4
        ├── even_montage.mp4
        ├── final_promo_7.mp4
        ├── gym_diet.mp4
        ├── maa spaces.mp4
        ├── messi edit_2.mp4
        ├── podcast_demo.mp4
        ├── sdg2.mp4
        ├── show reel_motion_graphics.mp4
        └── showreel.mp4
```

## Image references

| File | Intended reference |
|---|---|
| `references/personal/about_page.png` | Personal portrait / About-section visual reference. Preserve the monochrome treatment and black-background cutout look as a reference; do not assume it must be used unchanged. |
| `references/brand/first_page_hero.png` | Hero-section portrait reference: rear-facing pose, plaid shirt, black background, full-body vertical composition. |

## Video portfolio assets

These are source portfolio videos, not merely inspiration references. Inspect each one before deciding its role in the redesigned work gallery.

- `references/videos/5rules final v2.mp4`
- `references/videos/brand_campaign.mp4`
- `references/videos/even_montage.mp4`
- `references/videos/final_promo_7.mp4`
- `references/videos/gym_diet.mp4`
- `references/videos/maa spaces.mp4`
- `references/videos/messi edit_2.mp4`
- `references/videos/podcast_demo.mp4`
- `references/videos/sdg2.mp4`
- `references/videos/show reel_motion_graphics.mp4`
- `references/videos/showreel.mp4`

Do not invent project titles, clients, outcomes, or categories from filenames alone. Watch or inspect the actual content and use accurate descriptions. If any video's context is unclear, leave its title/category editable or ask me.

## Instructions for Claude Code

1. Read this file and the project's `CLAUDE.md` and `portfolio-project-memory.md` before changing the website.
2. Treat the actual image and video files in `references/` as the source of truth for visual/media inspection. A filename or this Markdown entry is not a substitute for opening the asset.
3. Inspect the two images directly. For each MP4, inspect duration, dimensions, aspect ratio, frame rate, and file size. If video playback/vision is unavailable, use `ffprobe` and extract a small set of representative frames with `ffmpeg` for visual review. Do not claim to have watched a video if you only inspected metadata or frames.
4. Keep original source files unchanged. Do not overwrite, compress, rename, or delete them without approval. Generate thumbnails/posters or optimized derivatives in a separate output folder.
5. Use the supplied personal photos where they make sense in the design. Do not generate substitute portraits or use stock photos in their place.
6. Use the supplied videos as the real portfolio work. Do not replace them with placeholder videos, unrelated stock footage, or fabricated project work.
7. Build a media manifest mapping each video to its verified title, category, aspect ratio, poster, and playback path. Keep uncertain metadata clearly marked for my review.
8. Use lazy loading and poster images. Do not preload every full video. On desktop, allow one hover preview at a time and stop it when the pointer leaves. On touch devices, use an explicit tap-to-play interaction. Pause inactive videos.
9. Preserve accessibility, keyboard operation, reduced-motion preferences, responsive behavior, and performance.
10. Do not expose private file paths, credentials, or environment variables in the public website.
11. Do not deploy, publish, or push to GitHub. Finish with a summary of files changed, tests run, and anything requiring my approval.

## Important distinction: project files vs Claude memory

Claude Code can use these assets when the files physically exist inside the local project folder that Claude Code has opened. This Markdown file is an index/instruction sheet; it does not contain the image or video data. Keep the actual media files in the matching `references/` folders and commit/share them only if appropriate for your repository and file-size limits.
