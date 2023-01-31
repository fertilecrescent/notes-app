
const root = 'http://localhost:3000';

const Globals = {};

class NotesContainer {

    static _container = document.getElementById('notes-container');
    static _notes = document.getElementById('all-notes');

    static hide() {
        this._notes.innerHTML = '';
        this._container.style.display = 'none';
    }

    static display(folder_name) {
        this._notes.innerHTML = '';
        this._container.style.display = 'block';
        Database.getNotes(folder_name).then(
            (res) => {res.note_names.forEach(n => new Note(res.folder_name, n).display())},
            (err) => console.log(err)
        );
    }
}

Globals['selectedFolder'] = null;
Globals['selectedNote'] = null;

class Database {

    static getAllFolders() {
        return fetch(`${root}/folders/`)
        .then(async (res) => {
                if (!res.ok) {
                    Promise.reject(new Error(`Server error: status code ${res.status}`));
                } else {
                    return await res.json();
                };
            }, (err) => {return Promise.reject(err);}
        );
    };

    static addFolder(name) {
        return fetch(`${root}/folders/${name}`, {method: 'POST'})
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
        return fetch(`${root}/folders/${name}`, options)
        .then((res) => {
                if (!res.ok) {return Promise.reject(new Error('Server error'))} 
                else {return Promise.resolve()}
            }, (err) => {
                return Promise.reject(err);
            }
        );
    };

    static getNotes(folder_name) {
        const options = {method: 'GET'};
        return fetch(`${root}/folders/${folder_name}`, options)
        .then(async (res) => {
                if (!res.ok) {
                    return Promise.reject(new Error(`Server error: status code ${res.status}`));
                } else {
                    const note_names = await res.json();
                    return Promise.resolve({folder_name: folder_name, note_names: note_names});
                }
            }, (err) => {return Promise.reject(err);}
        );
    }

    static addNote(folder_name, note_name) {
        const options = {method: 'POST'};
        return fetch(`${root}/folders/${folder_name}/${note_name}`, options).then((res) => {
            if (res.ok) {return Promise.resolve(note_name);}
            else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {
            return Promise.reject(err);
        });
    }

    static deleteNote(folder_name, note_name) {
        const options = {method: 'DELETE'};
        return fetch(`${root}/folders/${folder_name}/${note_name}`, options).then(
            (res) => {
                if (!res.ok) {return Promise.reject(new Error(`Server error: status code ${res.status}`));}
                else {return Promise.resolve();}
            }, (err) => {
                return Promise.reject(err)
            });
    }
}

class Folder {

    constructor(name) {
        this.name = name;
        this._container = document.getElementById('all-folders');
        this._dom = this._render();
    }

    _clickCallback() {
        return () => {
            if(!this._isSelected()) {
                this.select();
            } else {
                this.clearSelection();
                if (Globals.selectedNote) {
                    Globals.selectedNote.clearSelection();
                }
            }
        }
    }

    _render() {
        const folder = document.createElement('div');
        folder.className = 'folder clickable';
        folder.textContent = this.name;
        folder.dataset['name'] = this.name;
        folder.addEventListener('click', this._clickCallback());
        return folder;
    }

    _isSelected() {
        return Object.is(Globals.selectedFolder, this);
    }

    select() {
        if (!this._isSelected()) {
            if (Globals.selectedFolder) {
                Globals.selectedFolder.clearSelection();
            }
            Globals.selectedFolder = this;
            this._dom.classList.add('selected');
            NotesContainer.display(this.name);
        }
    }

    clearSelection() {
        if (this._isSelected()) {
            this._dom.classList.remove('selected');
            Globals.selectedFolder = null;
        };
        NotesContainer.hide();
    }

    display() {
        this._container.appendChild(this._dom);
    }

    delete() {
        Database.deleteFolder(this.name)
        .then((res) => {
                this.clearSelection();
                this._dom.remove();
                NotesContainer.hide();
            }, (err) => {console.log(err);}
        );
    }
}

class Note {
    constructor(folder_name, note_name) {
        console.log(folder_name, note_name)
        this.folder_name = folder_name;
        this.name = note_name;
        this._body = null;
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
        if (!this._isSelected()) {
            if (Globals.selectedNote) {
                Globals.selectedNote.clearSelection();
            }
            Globals.selectedNote = this;
            this._dom.classList.add('selected');
        }
    }

    clearSelection() {
        if (this._isSelected()) {
            this._dom.classList.remove('selected');
            Globals.selectedNote = null;
        };
    }

    display() {
        this._container.appendChild(this._dom);
    }

    delete() {
        Database.deleteNote(this.folder_name, this.name)
        .then((res) => {
                this.clearSelection();
                this._dom.remove();
            }, (err) => {console.log(err);}
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
        for (var folder of Array.from(document.getElementsByClassName('folder'))) {
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
                newFolder._dom.scrollIntoView({behavior: 'smooth'});
                document.getElementById('add-folder-input').blur();
            }, (err) => {console.log(err);}
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
        for (var note of Array.from(document.getElementsByClassName('note'))) {
            if (note.dataset.name === event.target.value) {
                alert(`There is a already a note named '${event.target.value}.'`
                + ' Please try again.')
                return
            }
        }
        Database.addNote(Globals.selectedFolder.name, event.target.value)
        .then((name) => {
                const newNote = new Note(Globals.selectedFolder.name, name);
                newNote.select();
                newNote.display();
                document.getElementById('add-note-input').blur();
            }, (err) => {console.log(err);}
        );
    };
});

document.getElementById('delete-note-button').addEventListener('click', (event) => {
    if (Globals.selectedNote) {
        Globals.selectedNote.delete();
    };
});

Database.getAllFolders()
.then((names) => {
        names.forEach(n => (new Folder(n)).display());
    }, (err) => {console.log(err);}
);