# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: the **Security** tab of this repository → **Report a vulnerability**. If you cannot use that, write through the contact form at https://domia.ai/contact and say it is a security report; you will be given a private channel.

Include what you can: the affected version or commit, how to reproduce it, and what an attacker gains. Never include real tokens, secrets or other people's voice recordings.

You will get an acknowledgement within a few days. A fix is prepared privately and credited to you in the release notes unless you prefer otherwise.

## Supported versions

Domia is pre-1.0. Only the `main` branch receives security fixes.

## What is in scope

The console reads and changes the configuration of voice-agent devices and stores a mirror of their conversations, so reports are especially useful about:

- access to the console itself and to its server functions and API routes
- how the console authenticates to devices (the mesh secret) and anything that would expose that secret or a provider token to the browser, to logs or to an export
- the archive: conversation text, traces and recorded audio reaching someone who should not see them
- demo mode: any path that lets a read-only demo write to a device or to the archive
- input that reaches a device unvalidated (configuration bundles, skill descriptors, uploaded files)

## Out of scope

- Attacks that require an already compromised host or physical access to an unlocked device.
- Vulnerabilities in the devices' own software — report those in [`domia-core`](https://github.com/domia-ai/domia-core/security).
