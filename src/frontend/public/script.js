
const Globals = {
    selectedFolder: null,
    selectedNote: null,
    awaitingServer: false, // so we can display a spinner to alert the user that data is on the way
    contentEdited: false
}

function handleNetworkError(err) {
    if (err.message.startsWith('Server error')) {
        alert('There was a problem on the server')
    } else {
        alert('There was a problem connecting to the server')
    }
}

class Spinner {

    // We call this function on a data displaying element just before a call to fetch its data is made.
    // It ensures that if the element has waited more than 'delay' milliseconds to hear from the database
    // a spinner will be displayed to assure the user that 'something is happening...be patient'.
    // The reason for 'delay' is that it is annoying to the user to briefly flash the spinner in the case
    // where the server is responding very quickly.
    static addSpinner(elem) {
        const delay = 100
        setTimeout(() => {
            if (Globals.awaitingServer) {
                const spinner = this.makeSpinner()
                elem.appendChild(spinner)
            }
        }, delay)
    }

    // We call this function on a data displaying element after it receives its data from the database.
    static removeSpinner(elem) {
        const spinner = elem.getElementsByClassName('spinner')[0]
        if (spinner) {
            spinner.remove()
        }
    }

    static makeSpinner() {
        const spinner = document.createElement('div')
        spinner.classList.add('spinner')
        return spinner
    }
}

class NotesController {

    static container = document.getElementById('notes-container')
    static notes = document.getElementById('all-notes')

    static hide() {
        this.notes.innerHTML = '' // clear its contents
        this.container.style.display = 'none'
    }

    static display(folder) {
        this.container.style.display = 'block' // make the background and border visible
        Spinner.addSpinner(this.container) // will display a spinner while waiting on Database
        Database.getNotes(folder).then(
            (res) => {
                Spinner.removeSpinner(this.container)
                res.notes.forEach(note => {
                    new Note(res.folder, note.name, note.body).display()
                })
            },
            (err) => handleNetworkError(err)
        )
    }
}

class TextController {

    static container = document.getElementById('text-area')

    static async saveValue() {
        Database.updateNote(Globals.selectedFolder.name, Globals.selectedNote.name, this.container.value)
        .then(null, (err) => handleNetworkError(err))
    }

    static hide() {
        this.container.style.display = 'none' // make invisible
    }

    static display(body) {
        this.container.value = body
        this.container.style.display = 'block' // make visible
    }

    static focus() {
        this.container.focus()
    }
}


class Database {

    static getAllFolders() {
        Globals.awaitingServer = true
        return fetch(`/folders`)
        .then(async (res) => {
                if (!res.ok) {
                    Globals.awaitingServer = false
                    return Promise.reject(new Error(`Server error: status code ${res.status}`))
                } else {
                    return res.json().then((folders) => {
                        Globals.awaitingServer = false
                        return Promise.resolve(folders)
                    }) 
                }
            }, (err) => {return Promise.reject(err)}
        )
    }

    static addFolder(name) {
        return fetch(`/${name}`, {method: 'POST'})
        .then((res) => {
                if (!res.ok) {
                    return Promise.reject(
                        new Error(`Server error: status code ${res.status}`)
                    )
                } else {return Promise.resolve(name)}
            }, (err) => {return Promise.reject(err)}
        )
    }

    static deleteFolder(name) {
        const options = {method: 'DELETE'}
        return fetch(`/${name}`, options)
        .then((res) => {
                if (!res.ok) {return Promise.reject(new Error('Server error'))} 
                else {return Promise.resolve()}
            }, (err) => {
                return Promise.reject(err)
            }
        )
    }

    static getNotes(folder) {
        const options = {method: 'GET'}
        Globals.awaitingServer = true
        return fetch(`/${folder}`, options)
        .then(async (res) => {
                if (!res.ok) {
                    Globals.awaitingServer = false
                    return Promise.reject(new Error(`Server error: status code ${res.status}`))
                } else {
                    return res.json().then((notes) => {
                        Globals.awaitingServer = false
                        return Promise.resolve({folder: folder, notes: notes})
                    })
                }
            }, (err) => {
                Globals.awaitingServer = false
                return Promise.reject(err)
            }
        )
    }

    static addNote(folder, note) {
        const options = {method: 'POST'}
        return fetch(`/${folder}/${note}`, options)
        .then((res) => {
            if (res.ok) {return Promise.resolve(note)}
            else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {return Promise.reject(err)})
    }

    static updateNote(folder, note, body) {
        const options = {
            method: 'PUT',
            body: JSON.stringify({'noteBody': body}),
            headers: {'content-type': 'application/json'}
        }
        return fetch(`/${folder}/${note}`, options)
        .then(async (res) => {
            if (res.ok) {
                return Promise.resolve()
            } else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {return Promise.reject(err)})
    }

    static deleteNote(folder, note) {
        const options = {method: 'DELETE'}
        return fetch(`/${folder}/${note}`, options)
        .then(
            (res) => {
                if (!res.ok) {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
                else {return Promise.resolve()}
            }, (err) => {
                return Promise.reject(err)
            })
    }
}

class Folder {

    constructor(name) {
        this.name = name
        this.container = document.getElementById('all-folders')
        this.dom = this.render()
    }

    clickCallback() {
        return () => {
            if(!this.isSelected()) {
                this.select()
            } else {
                this.clearSelection()
            }
        }
    }

    render() {
        const folder = document.createElement('div')
        folder.className = 'folder clickable'
        folder.textContent = this.name
        folder.dataset['name'] = this.name
        folder.addEventListener('click', this.clickCallback())
        return folder
    }

    isSelected() {
        return Object.is(Globals.selectedFolder, this)
    }

    select() {
        if (Globals.selectedNote) {Globals.selectedNote.clearSelection()}
        if (Globals.selectedFolder) {Globals.selectedFolder.clearSelection()}
        Globals.selectedFolder = this
        this.dom.classList.add('selected')
        NotesController.display(this.name)
    }

    clearSelection() {
        if (Globals.selectedNote) {Globals.selectedNote.clearSelection()}
        this.dom.classList.remove('selected')
        Globals.selectedFolder = null
        NotesController.hide()
    }

    scrollIntoView() {
        this.dom.scrollIntoView({behavior: 'smooth'})
    }

    display() {
        this.container.appendChild(this.dom)
    }

    delete() {
        Database.deleteFolder(this.name)
        .then((res) => {
                this.clearSelection()
                this.dom.remove()
                NotesController.hide()
            }, (err) => {handleNetworkError(err)}
        )
    }
}

class Note {
    constructor(folder_name, name, body) {
        this.folder_name = folder_name
        this.name = name
        this._body = body
        this.container = document.getElementById('all-notes')
        this.dom = this.render()
    }

    clickCallback() {
        return () => {
            if(!this.isSelected()) {
                this.select()
            } else {
                this.clearSelection()
            }
        }
    }

    render() {
        const note = document.createElement('div')
        note.className = 'note clickable'
        note.textContent = this.name
        note.dataset['name'] = this.name
        note.addEventListener('click', this.clickCallback())
        return note
    }

    isSelected() {
        return Object.is(Globals.selectedNote, this)
    }

    select() {
        if (Globals.selectedNote) {Globals.selectedNote.clearSelection()}
        Globals.selectedNote = this
        this.dom.classList.add('selected')
        TextController.display(this._body)
    }

    clearSelection() {
        TextController.hide()
        this.dom.classList.remove('selected')
        Globals.selectedNote = null
    }

    scrollIntoView() {
        this.dom.scrollIntoView({behavior: 'smooth'})
    }

    display() {
        this.container.appendChild(this.dom)
    }

    delete() {
        Database.deleteNote(this.folder_name, this.name)
        .then((res) => {
                this.clearSelection()
                this.dom.remove()
            }, (err) => {handleNetworkError(err)}
        )
    }
}

function disableClickables() {
    Array.from(document.getElementsByClassName('clickable')).forEach(clickable => {
        clickable.classList.remove('clickable')
        clickable.classList.add('unclickable')
    })
}

function enableClickables() {
    Array.from(document.getElementsByClassName('unclickable')).forEach(unclickable => {
        unclickable.classList.remove('unclickable')
        unclickable.classList.add('clickable')
    })
}

document.getElementById('delete-folder-button').addEventListener('click', () => {
    if (Globals.selectedFolder) {
        Globals.selectedFolder.delete()
    }
})

document.getElementById('add-folder-button').addEventListener('click', () => {
    disableClickables()
    const addFolderInput = document.getElementById('add-folder-input')
    addFolderInput.style.visibility = 'visible'
    addFolderInput.focus()
})

document.getElementById('add-folder-input').addEventListener('focusout', (event) => {
    event.preventDefault()
    enableClickables()
    const addFolderInput = document.getElementById('add-folder-input')
    addFolderInput.value = ''
    addFolderInput.style.visibility = 'hidden'
})

document.getElementById('add-folder-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const all_folders = Array.from(document.getElementsByClassName('folder'))
        for (let folder of all_folders) {
            if (folder.dataset.name === event.target.value) {
                alert(`There is a already a folder named '${event.target.value}.'`
                + ' Please try again.')
                return
            }
        }
        Database.addFolder(event.target.value)
        .then((name) => {
                const newFolder = new Folder(name)
                newFolder.select()
                newFolder.display()
                newFolder.scrollIntoView()
                document.getElementById('add-folder-input').blur()
            }, (err) => {handleNetworkError(err)}
        )
    }
})

document.getElementById('add-note-button').addEventListener('click', () => {
    disableClickables()
    const addNoteInput = document.getElementById('add-note-input')
    addNoteInput.style.visibility = 'visible'
    addNoteInput.focus()
})

document.getElementById('add-note-input').addEventListener('focusout', (event) => {
    event.preventDefault()
    enableClickables()
    const addNoteInput = document.getElementById('add-note-input')
    addNoteInput.value = ''
    addNoteInput.style.visibility = 'hidden'
})

document.getElementById('add-note-input').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const proposedNoteName = event.target.value
        const notes = Array.from(document.getElementsByClassName('note'))
        for (let n of notes) {
            if (n.dataset.name === proposedNoteName) {
                alert(`There is a already a note named '${event.target.value}.'`
                + ' Please try again.')
                return
            }
        }
        Database.addNote(Globals.selectedFolder.name, event.target.value)
        .then((name) => {
                const newNote = new Note(Globals.selectedFolder.name, name, '')
                newNote.select()
                TextController.focus()
                newNote.display()
                newNote.scrollIntoView()
                document.getElementById('add-note-input').blur() // effectively closes the input dialogue
            }, (err) => {handleNetworkError(err)}
        )
    }
})

document.getElementById('delete-note-button').addEventListener('click', (event) => {
    if (Globals.selectedNote) {
        Globals.selectedNote.delete()
    }
})

document.getElementById('text-area').addEventListener('change', async (event) => {
    Globals.selectedNote._body = event.currentTarget.value
    Globals.contentEdited = true
    TextController.saveValue()
})

Spinner.addSpinner(document.getElementById('all-folders'))
setTimeout(() => {
    Database.getAllFolders()
    .then((names) => {
            Spinner.removeSpinner(document.getElementById('all-folders'))
            names.forEach(n => (new Folder(n)).display())
        }, (err) => {handleNetworkError(err)}
    )
})