# Stream Deck Profile Patcher

A browser-based tool that strips machine-specific data from exported `.streamDeckProfile` files so they work on any computer.

**Live tool:** https://jarowe.github.io/sd-profile-patcher/

## The Problem

When you export a Stream Deck profile, it bakes in data specific to YOUR machine — hardware IDs, monitor serial numbers, IP addresses, absolute file paths, Discord channel IDs, etc. If you share that profile, other people import a broken mess of actions that can't find their devices.

## The Solution

Drop a `.streamDeckProfile` on the patcher and it strips the machine-specific settings while keeping everything that's universal (layout, styling, preferences, timezone strings, hotkeys, URLs). Plugins that support auto-discovery (like Wave Link 3) will re-detect hardware on first launch. Others preserve enough context (like app names) so the user knows what to re-select.

## What Gets Patched

### Enabled by Default

| Plugin | What's Stripped | What's Kept | Why |
|--------|----------------|-------------|-----|
| **Wave Link 3** | All Settings (hardware GUIDs) | Nothing — plugin auto-discovers | channelId, mixId, outputDeviceId are all machine-specific hardware GUIDs |
| **Window Mover** | Monitor IDs (`deviceName`, `manufacturerId`, `modelId`, `screenId`, `screenLabel`) | `configuredBounds` (e.g. "leftHalf") | Monitor serial numbers like "LG ULTRAGEAR" won't exist on other machines |
| **Weather** | `city`, `location`, `userLocation` (contains IP address!), display state | `actionType`, `units`, `theme`, `view` | Location data includes the exporter's IP address (privacy!) |
| **Open App** | `bundle_id`, `bundle_path`, `exec`, `source` | `app_name`, `args`, `bring_to_front` | Paths like `C:\Users\rowej\AppData\...` are machine-specific |
| **System Vitals** | `my_custom_ip`, `my_execute_url` | All styling/colors/chart settings | Custom IPs and exe paths are machine-specific |
| **Discord Voice** | `channel` (channel ID) | `server` | Discord channel IDs are server-specific |

### Optional (Off by Default)

| Plugin | What's Stripped | Why It's Optional |
|--------|----------------|-------------------|
| **Soundboard** | `path` (audio file path) | Audio files may be bundled in the profile export — stripping guarantees they break |
| **Open (File/Folder)** | `path` | Keeping the path preserves user intent and may work on same OS |

### Never Patched (Already Universal)

Spotify, Hotkeys, Multimedia, Clocks (timezone strings), Website (URLs), Volume Controller (`deviceId: "default"`), Text/Emoji, Discord Mute/Deafen, Voicemod

## Sub-Action Recursion

The patcher recurses into nested action containers:
- **Dial Stacks** (`com.elgato.streamdeck.dial.stack`) — Actions array with sub-groups
- **Multi-Actions** (`com.elgato.streamdeck.multiactions.routine`) — Nested `{Actions: [{Actions: [...]}]}` format
- **Keys Adaptors** (`com.elgato.streamdeck.keys.adaptor`) — 3 sub-actions for [rotateLeft, press, rotateRight]

This catches Wave Link 3 actions (and others) buried inside stacks that a naive top-level scan would miss.

## How It Works

1. User drops a `.streamDeckProfile` file (which is a ZIP archive)
2. JSZip extracts all `manifest.json` files from the profile
3. Each manifest's `Controllers[].Actions` are scanned against enabled patch rules
4. Machine-specific Settings keys are stripped per-rule
5. Patched manifests are written back into the ZIP
6. Browser downloads `*_patched.streamDeckProfile`

Everything runs client-side in the browser. No files are uploaded anywhere.

## Architecture

Single `index.html` with no build step. Uses [JSZip](https://stuk.github.io/jszip/) from CDN.

The `PATCH_RULES` array is the single source of truth — it drives both the checkbox UI and the patching logic. Each rule has:
- `id` — unique key
- `name` / `desc` — displayed in the UI
- `defaultOn` — whether checked by default
- `match(uuid)` — tests if an action UUID belongs to this rule
- `patch(action)` — mutates `action.Settings`, returns true if anything changed

## Deployment

Hosted on GitHub Pages from the `master` branch. Push to deploy.

## Origin

Built for the [SD+ XL Default Profile](https://github.com/jarowe/SDplusXL-default-profile) project to make shared profiles portable, but works with any Stream Deck profile export.
