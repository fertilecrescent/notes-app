
const root = 'http://localhost:3000';

const Globals = {
    selectedFolder: null,
    selectedNote: null,
    awaitingServer: false,
    contentEdited: false
};

function addSpinner(elem) {
    const delay = 100;
    setTimeout(() => {
        if (Globals.awaitingServer) {
            const spinner = makeSpinner();
            elem.appendChild(spinner);
        };
    }, delay);
};

function removeSpinner(elem) {
    const spinner = elem.getElementsByClassName('spinner')[0];
    if (spinner) {
        spinner.remove()
    };
};

function makeSpinner() {
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    return spinner;
};

function handleNetworkError(err) {
    if (err.startsWith('Server error')) {
        alert('There was a problem on the server')
    } else {
        alert('There was a problem connecting to the server')
    }
}

class NotesController {

    static _container = document.getElementById('notes-container');
    static _notes = document.getElementById('all-notes');

    static hide() {
        this._notes.innerHTML = '';
        this._container.style.display = 'none';
    }

    static display(folder) {
        this._notes.innerHTML = '';
        this._container.style.display = 'block';
        addSpinner(this._container);
        Database.getNotes(folder).then(
            (res) => {
                removeSpinner(this._container)
                res.notes.forEach(note => {
                    new Note(res.folder, note.name, note.body).display();
                });
            }, (err) => console.log(err)
        );
    }
}

class TextController {

    static _container = document.getElementById('text-area');

    static async saveValue() {
        Database.updateNote(Globals.selectedFolder.name, Globals.selectedNote.name, this._container.value);
    }

    static hide() {
        this._container.style.display = 'none';
    };

    static display(body) {
        this._container.value = body;
        this._container.style.display = 'block';
    };

    static focus() {
        this._container.focus()
    }
};


class Database {

    static getAllFolders() {
        Globals.awaitingServer = true;
        return fetch(`/folders`)
        .then(async (res) => {
                if (!res.ok) {
                    Globals.awaitingServer = false;
                    return Promise.reject(new Error(`Server error: status code ${res.status}`));
                } else {
                    const folders = await res.json();
                    Globals.awaitingServer = false;
                    return folders;
                };
            }, (err) => {return Promise.reject(err);}
        );
    };

    static addFolder(name) {
        return fetch(`/${name}`, {method: 'POST'})
        .then((res) => {
                if (!res.ok) {
                    return Promise.reject(
                        new Error(`Server error: status code ${res.status}`)
                    );
                } else {return Promise.resolve(name);}
            }, (err) => {return Promise.reject(err);}
        )
    };

    static deleteFolder(name) {
        const options = {method: 'DELETE'};
        return fetch(`/${name}`, options)
        .then((res) => {
                if (!res.ok) {return Promise.reject(new Error('Server error'))} 
                else {return Promise.resolve()}
            }, (err) => {
                return Promise.reject(err);
            }
        );
    };

    static getNotes(folder) {
        const options = {method: 'GET'};
        Globals.awaitingServer = true;
        return fetch(`/${folder}`, options)
        .then(async (res) => {
                if (!res.ok) {
                    Globals.awaitingServer = false
                    return Promise.reject(new Error(`Server error: status code ${res.status}`));
                } else {
                    const notes = await res.json();
                    Globals.awaitingServer = false;
                    return Promise.resolve({folder: folder, notes: notes});
                }
            }, (err) => {
                Globals.awaitingServer = false
                return Promise.reject(err);
            }
        );
    }

    static addNote(folder, note) {
        const options = {method: 'POST'};
        return fetch(`/${folder}/${note}`, options)
        .then((res) => {
            if (res.ok) {return Promise.resolve(note);}
            else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {return Promise.reject(err);});
    }

    static updateNote(folder, note, body) {
        console.log('updating note')
        const options = {
            method: 'PUT',
            body: JSON.stringify({'noteBody': body}),
            headers: {'content-type': 'application/json'}
        };
        // return fetch(`/${folder}/${note}?` + new URLSearchParams({body: body}), options)
        return fetch(`/${folder}/${note}`, options)
        .then(async (res) => {
            if (res.ok) {
                return Promise.resolve();
            } else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {return Promise.reject(err)});
    };

    static deleteNote(folder, note) {
        const options = {method: 'DELETE'};
        return fetch(`/${folder}/${note}`, options)
        .then(
            (res) => {
                if (!res.ok) {return Promise.reject(new Error(`Server error: status code ${res.status}`));}
                else {return Promise.resolve();}
            }, (err) => {
                return Promise.reject(err)
            });
    };
};

class Folder {

    constructor(name) {
        this.name = name;
        this._container = document.getElementById('all-folders');
        this._dom = this._render();
    };

    _clickCallback() {
        return () => {
            if(!this._isSelected()) {
                this.select();
            } else {
                this.clearSelection();
            }
        }
    };

    _render() {
        const folder = document.createElement('div');
        folder.className = 'folder clickable';
        folder.textContent = this.name;
        folder.dataset['name'] = this.name;
        folder.addEventListener('click', this._clickCallback());
        return folder;
    };

    _isSelected() {
        return Object.is(Globals.selectedFolder, this);
    };

    select() {
        if (Globals.selectedNote) {Globals.selectedNote.clearSelection();}
        if (Globals.selectedFolder) {Globals.selectedFolder.clearSelection();}
        Globals.selectedFolder = this;
        this._dom.classList.add('selected');
        NotesController.display(this.name);
    };

    clearSelection() {
            
        if (Globals.selectedNote) {Globals.selectedNote.clearSelection();}
        this._dom.classList.remove('selected');
        Globals.selectedFolder = null;
        NotesController.hide();
    }

    scrollIntoView() {
        this._dom.scrollIntoView({behavior: 'smooth'});
    };

    display() {
        this._container.appendChild(this._dom);
    };

    delete() {
        Database.deleteFolder(this.name)
        .then((res) => {
                this.clearSelection();
                this._dom.remove();
                NotesController.hide();
            }, (err) => {handleNetworkError(err);}
        );
    };
}

class Note {
    constructor(folder_name, name, body) {
        this.folder_name = folder_name;
        this.name = name;
        this._body = body;
        this._container = document.getElementById('all-notes');
        this._dom = this._render();
    }

    _clickCallback() {
        return () => {
            if(!this._isSelected()) {
                this.select();
            } else {
                this.clearSelection();
            }
        }
    }

    _render() {
        const note = document.createElement('div');
        note.className = 'note clickable';
        note.textContent = this.name;
        note.dataset['name'] = this.name;
        note.addEventListener('click', this._clickCallback());
        return note;
    }

    _isSelected() {
        return Object.is(Globals.selectedNote, this);
    }

    select() {
        if (Globals.selectedNote) {Globals.selectedNote.clearSelection();}
        Globals.selectedNote = this;
        this._dom.classList.add('selected');
        TextController.display(this._body);
    }

    clearSelection() {
        TextController.hide();
        this._dom.classList.remove('selected');
        Globals.selectedNote = null;
    }

    scrollIntoView() {
        this._dom.scrollIntoView({behavior: 'smooth'});
    }

    display() {
        this._container.appendChild(this._dom);
    }

    delete() {
        Database.deleteNote(this.folder_name, this.name)
        .then((res) => {
                this.clearSelection();
                this._dom.remove();
            }, (err) => {handleNetworkError(err);}
        )
    }
}

function disableClickables() {
    Array.from(document.getElementsByClassName('clickable')).forEach(clickable => {
        clickable.classList.remove('clickable');
        clickable.classList.add('unclickable');
    });
}

function enableClickables() {
    Array.from(document.getElementsByClassName('unclickable')).forEach(unclickable => {
        unclickable.classList.remove('unclickable');
        unclickable.classList.add('clickable');
    });
}

document.getElementById('delete-folder-button').addEventListener('click', () => {
    if (Globals.selectedFolder) {
        Globals.selectedFolder.delete();
    };
});

document.getElementById('add-folder-button').addEventListener('click', () => {
    disableClickables();
    const addFolderInput = document.getElementById('add-folder-input');
    addFolderInput.style.visibility = 'visible';
    addFolderInput.focus();
});

document.getElementById('add-folder-input').addEventListener('focusout', (event) => {
    event.preventDefault();
    enableClickables();
    const addFolderInput = document.getElementById('add-folder-input');
    addFolderInput.value = '';
    addFolderInput.style.visibility = 'hidden';
});

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
                const newFolder = new Folder(name);
                newFolder.select();
                newFolder.display();
                newFolder.scrollIntoView();
                document.getElementById('add-folder-input').blur();
            }, (err) => {handleNetworkError(err);}
        );
    };
});

document.getElementById('add-note-button').addEventListener('click', () => {
    disableClickables();
    const addNoteInput = document.getElementById('add-note-input');
    addNoteInput.style.visibility = 'visible';
    addNoteInput.focus();
});

document.getElementById('add-note-input').addEventListener('focusout', (event) => {
    event.preventDefault();
    enableClickables();
    const addNoteInput = document.getElementById('add-note-input');
    addNoteInput.value = '';
    addNoteInput.style.visibility = 'hidden';
});

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
                const newNote = new Note(Globals.selectedFolder.name, name, '');
                newNote.select();
                TextController.focus()
                newNote.display();
                newNote.scrollIntoView();
                document.getElementById('add-note-input').blur(); // effectively closes the input dialogue
            }, (err) => {handleNetworkError(err);}
        );
    };
});

document.getElementById('delete-note-button').addEventListener('click', (event) => {
    if (Globals.selectedNote) {
        Globals.selectedNote.delete();
    };
});

document.getElementById('text-area').addEventListener('change', async (event) => {
    Globals.selectedNote._body = event.currentTarget.value;
    Globals.contentEdited = true
    console.log('about to save')
    TextController.saveValue()
});

addSpinner(document.getElementById('all-folders'));
setTimeout(() => {
    Database.getAllFolders()
    .then((names) => {
            removeSpinner(document.getElementById('all-folders'));
            names.forEach(n => (new Folder(n)).display());
        }, (err) => {handleNetworkError(err);}
    );
});
