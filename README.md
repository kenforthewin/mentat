# Untitled Group Chat App

[X] is a group chat application with a focus on message tagging and privacy. It allows deep categorization and retrieval of messages based on tags (a la Twitter hashtags). It also aims for reasonable privacy, meaning everything aside from feature metadata is end-to-end encrypted with OpenPGP, including avatars. Feature metadata means anything that the server depends on in order to deliver a feature; tags are stored in plaintext in order to index and retrieve them from the database, and URLs are sent as plaintext so the server can ping them and generate a thumbnail.

See it in action here:

Put a gif here

## User Authentication

User auth deserves its own section because it's nonstandard. Like the [Web Auth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API), [X] uses asymmetric cryptography for authentication. When you first join a chat room, a personal keypair will be generated and stored in browser storage. If you are the creator of this room, the client will also generate a keypair for the room. If not, a request will be generated: the client will send its personal public key to the server and request access to the room. Someone who already has the group keypair must accept the request to grant you access. When the member accepts your request, her client will encrypt the room private key with your public key and send the encrypted key to the server. Now your client can grab the room key, decrypt it, and begin decrypting the room's messages.

Right now, it's the user's responsibility to use a secure device that only she has access to. On the roadmap, a user could specify a temporary session that would be deleted after a certain amount of time or inactivity.

## Features

- End-to-end encryption by default
- Deeply embedded tagging system
- Link previews
- Web notifications

## Stack

- fully containerized

### Server

- Phoenix/Elixir
- Postgres

### Client

- React/Redux
- OpenPGP.js

## Development

`./scripts/run_dev.sh`

`localhost:4000`

## Project Structure

## Invitation to contribute
