# Chateo della Computadora
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

A simple p2p lan chat.

Built with Electron, Angular and other cool technologies.  
The chat is developed for [Entract Multimedia](http://www.entract.it/), an Agency who organises the technical part of meetings and conferences.

## Build
```
$ npm install
$ bower install
$ npm run build:es6
$ npm start
```

## TODO
- [ ] Change username inside the chat without relaunch the whole app.
- [ ] Save in a settings.json the username *(now in user.json)* and all the settings
- [ ] On Mac Chateo must create a backup folder in Documents
- [ ] Implement backup via LevelDB on Windows and Mac
- [ ] Bigger autofocus area in the input area
- [ ] Implement copy and paste
- [ ] Notify the user when a message arrives and the window is not focused.

## Contributing
If you feel you can help in any way, be it with examples, extra testing, or new features please open a pull request or open an issue.  

The code follow the Standard code style.  
[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

______________________________________________________________________________________________________________________
## License
The code is released under the GNU GPLv2 license.

The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and non infringement. In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the software or the use or other dealings in the software.
