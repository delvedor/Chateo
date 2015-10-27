import app from 'app'
import BrowserWindow from 'browser-window'
import ipc from 'ipc'
import airswarm from 'airswarm'
import jsonStream from 'duplex-json-stream'
import streamSet from 'stream-set'
import { getAppVersion } from 'appversion'
// import Menu from 'menu'
import level from 'level'

let mainWindow
let users = []
let user = null
const activeSockets = streamSet()
const db = level('ChateoDB')

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768
  })
  // mainWindow.openDevTools()
  mainWindow.setResizable(true)
  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadUrl(`file://${__dirname}/../browser/index.html`)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Hides menu on mac
  // if (process.platform === 'darwin') Menu.setApplicationMenu(Menu.buildFromTemplate([]))

  // Testing messages
  /* let count = 1
  setInterval(() => {
    count++
    mainWindow.webContents.send('newMessage', {
      type: 'message',
      content: {
        user: 'user',
        time: new Date().getTime(),
        text: `message n° ${count}`,
        color: '#000000'
      }
    })
  }, 50) */

  // Creates the airswarm connection
  airswarm('chateolocalnetwork', function (socket) {
    socket = jsonStream(socket)
    activeSockets.add(socket)
    if (user)
      socket.write({type: 'newUser', content: user})

    // data event
    socket.on('data', function (data) {
      if (data.type === 'newUser') {
        users.push({username: data.content, socket: socket})
        let connectedUsers = []
        for (let i = 0, arrLen = users.length; i < arrLen; i++) {
          connectedUsers.push(users[i].username)
        }
        mainWindow.webContents.send('connectedUsers', connectedUsers)
      } else if (data.type === 'message' || data.type === 'privateMessage') {
        mainWindow.webContents.send('newMessage', data)
      }
    })

    // close event
    socket.on('close', () => {
      for (let i = 0, arrLen = users.length; i < arrLen; i++) {
        if (socket === users[i].socket) {
          users.splice(i, 1)
          break
        }
      }
      activeSockets.remove(socket)
      let connectedUsers = []
      for (let i = 0, arrLen = users.length; i < arrLen; i++) {
        connectedUsers.push(users[i].username)
      }
      mainWindow.webContents.send('connectedUsers', connectedUsers)
    })
  })

  // message from browser process
  ipc.on('sendMessage', (event, data) => {
    if (data.recipient) {
      for (let i = 0, userLen = users.length; i < userLen; i++) {
        if (users[i].username === data.recipient) {
          users[i].socket.write({type: 'privateMessage', content: data})
          break
        }
      }
    } else {
      activeSockets.forEach((s) => {
        s.write({type: 'message', content: data})
      })
    }
    // stores in the level db the message
    db.get(data.user, { valueEncoding: 'json' }, (err, value) => {
      console.log(typeof value, value)
      if (err) {
        db.put(data.user, [data], { valueEncoding: 'json' })
      } else {
        value.push(data)
        db.put(data.user, value, { valueEncoding: 'json' })
      }
    })
  })

  // new user from browser process
  ipc.on('sendNewUser', (event, username) => {
    console.log(username)
    let bool = true
    for (let i = 0, arrLen = users.length; i < arrLen; i++) {
      if (username === users[i].username) {
        bool = false
        break
      }
    }
    if (bool) {
      user = username
      activeSockets.forEach((s) => {
        s.write({type: 'newUser', content: user})
      })
    }
    event.sender.send('userAvailable', bool)
  })

  // version number from browser process
  ipc.on('getVersion', (event) => {
    getAppVersion((err, data) => {
      if (err) console.log(err)
      mainWindow.webContents.send('setVersion', data)
    })
  })
})

/*
  Message structure:

  message: {
    user: user,
    time: time,
    text: text,
    color: color
  }

  privateMessage: {
    user: user,
    time: time,
    text: text,
    recipient: recipient,
    color: color
  }

  -> The color field is verbose
 */
