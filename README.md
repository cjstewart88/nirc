# nirc
A simple web browser IRC client written in Node.js.

## Setup
Node.js and NPM are required and should be setup before attempting to setup nirc.

- Clone the repo and cd into the directory:

```
      $ git clone https://github.com/cjstewart88/nirc.git
      $ cd nirc
```

- Install dependencies using npm:

```
      $ npm install
```

- Start the service:

```
      $ node server
``` 

- Open the app in your browser at `http://localhost:3000/`.

## Themes
Roll your own theme by:

1. Create a folder for your theme in the `public/stylesheets/themes` directory.
1. Add your custom css and images to this folder.
2. Update line `11` in `views/index.html` to point to your new theme.
3. If you're proud of your theme open a PR to include it!

## Contribute
This project is available under the MIT License. Feel free to open PRs or issues to
help make nirc better.

#### Basic Git Workflow

- Clone the repo and cd into the directory:

```
      $ git clone https://github.com/cjstewart88/nirc.git
      $ cd nirc
```     

- Make a branch for your fixes or new features:

```
      $ git branch -d branch_name_here
```

- Make your changes, test to make sure they work and make sure no previous 
functionality is broken.

- Push to your fork Open a Pull Request!

#### Our IRC Channel
Join us in **#nirc** on **irc.freenode.net** for disscussion or to just say hey!