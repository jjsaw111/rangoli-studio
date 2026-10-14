# Rangoli Circle Studio

A responsive shared canvas for making a Rangoli together. Choose from Festival, Lotus, Sunrise, and Mehndi templates; select petals, leaves, diamonds, stars, diyas, or dots; and the shapes automatically face outward from the Rangoli center. Adjust the angle further if desired, then watch each mark repeat around the design in 4-, 6-, 8-, or 12-fold symmetry. Invite people with the room link, edit your displayed username, undo or clear custom marks, and save the artwork as SVG. Template changes and artwork are synchronized for everyone in the room.

There is no login, passcode, or email-sending feature. Your editable username is saved in this browser and broadcast to collaborators as live presence. The Rangoli artwork is saved/downloaded as SVG through the Save art action.

## GitHub Pages (static frontend only)

The repository includes a GitHub Actions workflow that builds the static frontend and publishes it to GitHub Pages on pushes to `main`. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the build/deployment source. Create or push a `main` branch to trigger deployment. For a project site the URL uses `https://<owner>.github.io/<repository>/`.

This app is now a static collaborative canvas, so it can run on GitHub Pages without login or mail backends. The collaboration uses public Yjs WebRTC signaling; visitors need internet connectivity. Anyone with the room URL can join and edit. Usernames are labels only and are not verified.

## Run locally

Install Node.js 20.19 or newer, then run `npm install` and `npm run dev`. Vite prints local and network URLs; use the network URL for same-network testing. Run `npm run build` to create and check the production build.

## Let people on your Wi-Fi/LAN join

Run `npm run dev` on the computer hosting the studio. Vite listens on the network interfaces and prints a **Network** address. Share that address and the same room URL with other people on the same network. If Windows Firewall asks, allow Node.js on **Private networks**. If it does not prompt, allow inbound TCP port `5173` on the Private profile in Windows Defender Firewall. Guests must be on a network that can reach the host computer; guest Wi-Fi or client isolation can block device-to-device access. The live Yjs collaboration also uses public WebRTC signaling servers, so internet access is needed for peers to discover each other with the current setup.

To collaborate, share the room URL. The canvas uses Yjs with the y-webrtc provider for peer-to-peer synchronization; browsers need WebRTC connectivity and access to the provider's public signaling servers. Some restrictive networks may block peer connections.

## Open-source components and original work

- React and React DOM — MIT
- Yjs and y-webrtc — MIT
- lucide-react — ISC
- Vite — MIT
- DM Sans and Playfair Display — SIL Open Font License 1.1

The Rangoli illustration is drawn from original SVG geometry in this project. No stock art, third-party artwork, or external image assets are used. Keep the listed license notices if redistributing dependencies, and review each package's current license and notices for your distribution requirements. Open-source licensing reduces dependency licensing friction, but is not a blanket guarantee against every possible copyright claim.
