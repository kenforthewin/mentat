# Mentat

[ ![Codeship Status for kenforthewin/mentat](https://app.codeship.com/projects/b39d7c00-3d9f-0136-ecdb-161825e9517a/status?branch=master)](https://app.codeship.com/projects/290692)

Mentat is a group chat application with a focus on message tagging and privacy. It allows deep categorization and retrieval of messages based on tags (a la Twitter hashtags). It also aims for reasonable privacy, meaning everything aside from feature metadata is end-to-end encrypted with OpenPGP, including avatars. Feature metadata is anything that the server depends on in order to deliver a feature; tags are stored in plaintext in order to index and retrieve them from the database, and URLs are sent as plaintext so the server can ping them and generate a thumbnail.

See it in action here:

https://groupchat.kenforthewin.com

## Features

- End-to-end encryption by default
- Deeply embedded tagging system
- Link previews
- Web notifications

## Usage Instructions

### Inviting users

Each room is identified by its UUID. To invite a user, either share the UUID found in the URL of the room, or simply share the URL. The user will be instructed to set a username, then a new request will be generated. Click the users icon in the upper left corner and accept the request to add the user to the group.

### Adding message tags

Message tagging is the key feature of Mentat. There are several ways to add a tag to a message:

1. Embed a tag in the message, like you can with a tweet.
2. Select a tag or several tags from the tag dropdown. When you send a message, all the selected tags will be added to the message.
3. Click the plus icon next to a message after it is sent. Type the tag and press Enter.

### Browsing tags

When you start a session, no tags are selected. In this view, you will see every message that is sent, and you can scroll through all previous messages. When you select a tag, you will only see past messages that have that tag, and you will only receive messages with that tag. You can select several tags to sort by a number of categories, allowing quick access to past messages on the topic that interests you. Use this feature to categorize your messages based on project, memes, events, etc.

## User Authentication

Like the [Web Auth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API), Mentat uses asymmetric cryptography for authentication. When you first join a chat room, a personal keypair will be generated and stored in browser storage. If you are the creator of this room, the client will also generate a keypair for the room. If not, a request will be generated: the client will send its personal public key to the server and request access to the room. Someone who already has the group keypair must accept the request to grant you access. When the member accepts your request, her client will encrypt the room private key with your public key and send the encrypted key to the server. Now your client can grab the room key, decrypt it, and begin decrypting the room's messages.

Right now, it's the user's responsibility to use a secure device that only she has access to. On the roadmap, a user could specify a temporary session that would be deleted after a certain amount of time or inactivity.

## Stack

- fully containerized

### Server

- Phoenix/Elixir
- Postgres

### Client

- React/Redux
- OpenPGP.js

## Development

Ensure that Docker and docker-compose are installed and the Docker daemon is running. Start the development environment by navigating to the root of the project and running the following script: `./scripts/run_dev.sh`. Once the compilation and Javascript build are complete, the app will be available at `http://localhost:4000`.

## Project Structure

## Invitation to contribute
