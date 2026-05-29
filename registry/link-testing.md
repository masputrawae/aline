---
title: Testing Link dan Embed
description: Testing link dan embed untuk plugin remark-wiki-link dan remark-relative-path
pubDate: 2026-05-29
---

# Testing Plugins

Halaman ini digunakan untuk memverifikasi fungsionalitas plugin `remark-wiki-link` dan `remark-relative-path`.

## 1. Remark Wiki Link

### Internal Links
- **Simple:** [[about]] (Seharusnya ke `/about/`)
- **Nested:** [[blog/first-post]] (Seharusnya ke `/blog/first-post/`)
- **Short ID for Nested:** [[first-post]] (Seharusnya ke `/blog/first-post/`)
- **Folder/Index:** [[notes]] (Seharusnya ke `/notes/`)
- **Folder/Index with trailing slash:** [[notes/]] (Seharusnya ke `/notes/`)
- **Deeply Nested:** [[notes/other/hoho]] (Seharusnya ke `/notes/other/hoho/`)
- **With Alias:** [[notes/random-thought|Catatan Random]] (Seharusnya teksnya "Catatan Random")
- **With Anchor:** [[about#kontak]] (Seharusnya ke `/about/#kontak`)
- **With Anchor & Alias:** [[about#kontak|Hubungi Kami]] (Seharusnya teksnya "Hubungi Kami")
- **Broken Link:** [[file-tidak-ada]] (Seharusnya muncul sebagai `span` dengan class `broken-link`)

### Embeds
- **Image:** ![[flying_notes.jpg]]
- **Image with Size (Width):** ![[flying_notes.jpg|300]]
- **Image with Width x Height:** ![[flying_notes.jpg|400x200]]
- **Image with Title/Alias:** ![[mountain_view_and_a_man.jpg|Pemandangan Gunung]]
- **Asset from subfolder:** ![[images/rocket_launch.jpg]]
- **Non-Image Asset (PDF):** ![[dummy.pdf]] (Jika ada, seharusnya jadi iframe)

---

## 2. Remark Relative Path

Plugin ini mengubah link file markdown menjadi URL bersih (Clean URLs) relatif terhadap lokasi build.

- **Same Directory:** [About Me](./about.md) (Seharusnya ke `../about/`)
- **Index File:** [Home Index](./index.md) (Seharusnya ke `../`)
- **Nested File:** [Random Thought](./notes/random-thought.md) (Seharusnya ke `../notes/random-thought/`)
- **Nested Index:** [Notes Section](./notes/_index.md) (Seharusnya ke `../notes/`)
- **Deeply Nested:** [Hoho](./notes/other/hoho.md) (Seharusnya ke `../notes/other/hoho/`)
- **Relative Asset Link:** [Rocket Launch](./assets/images/rocket_launch.jpg) (Seharusnya ke `../assets/images/rocket_launch.jpg`)
- **Absolute-like Path (ignored):** [External](https://google.com)
- **Anchor only (ignored):** [Top](#top)

---

## 3. Kombinasi

- **Wiki Link to Index:** [[notes/index]] atau [[notes/]]
- **Relative Link with Anchor:** [Go to Contact](./about.md#contact) (Seharusnya ke `../about/#contact`)
