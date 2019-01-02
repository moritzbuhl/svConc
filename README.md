# svConc

A simple visualization application for concordance

## Getting Started

svConc strictly follows the NIH syndrome and therefore tries to remove
dependencies on good written, battle-tested and bloated libraries wherever
possible.

### Prerequisites

svConc uses the Node.js runtime and it's npm package manager.

```sh
apt install nodejs npm
```

### Installing

Dowload all dependencies
```sh
npm install
```

Build the application by running the install script
```sh
node bin/build
```

Run the application on a HTTP server
```sh
npm run
```

## Deployment

To deploy this application the files from `build/Release` into your WWW root.

## Author

**Moritz Buhl** - *Initial work* - [moritzbuhl](https://github.com/moritzbuhl)

## License

This project is licensed under the GNU AFFERO GENERAL PUBLIC LICENSE
- see the [LICENSE](LICENSE) file for details
