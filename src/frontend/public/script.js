
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
        Database.getNotesForFolder(folder_name).then(
            (note_names) => {note_names.forEach(n => new Note(n).display())},
            (err) => console.log(err)
        );
    }
}

class Selection {

    constructor() {
        this._item = null;
    }

    isEmpty() {
        return this._item === null
    }

    select(item) {
        this.clear();
        item._dom.classList.add('selected');
        this._item = item;
    }

    clear() {
        if (!this.isEmpty()) {
            this._item._dom.classList.remove('selected');
        }
        this._item = null;
    }

    delete() {
        this._item.delete();
    }
}

Globals.selections = {
    folder: new Selection(),
    note: new Selection()
}

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

    static getNotesForFolder(folder_name) {
        const options = {method: 'GET'};
        return fetch(`${root}/folders/${folder_name}`, options)
        .then(async (res) => {
                if (!res.ok) {
                    return Promise.reject(new Error(`Server error: status code ${res.status}`));
                } else {
                    return await res.json();
                }
            }, (err) => {return Promise.reject(err);}
        );
    }

    static deleteFolder(name) {
        const options = {method: 'DELETE'};
        return fetch(`${root}/folders/${name}`, options)
        .then((res) => {
                if (!res.ok) {
                    return Promise.reject(new Error('Server error'))
                };
            }, (err) => {
                return Promise.reject(err);
            }
        );
    };
}

class Folder {

    constructor(name) {
        this._name = name;
        this._container = document.getElementById('all-folders');
        this._dom = this._render();
    }

    _clickCallback() {
        return () => {
            if(!this._isSelected()) {
                this._select();
                NotesContainer.display(this._name);
            } else {
                console.log('no?')
                Globals.selections.folder.clear();
                NotesContainer.hide();
            }
        }
    }

    _render() {
        const folder = document.createElement('div');
        folder.className = 'folder clickable';
        folder.textContent = this._name;
        folder.dataset['name'] = this._name;
        folder.addEventListener('click', this._clickCallback());
        return folder;
    }

    _isSelected() {
        return Object.is(Globals.selections.folder._item, this);
    }

    _select() {
        Globals.selections.folder.select(this);
    }

    _clearSelection() {
        Globals.selections.folder.clear();
    }

    display() {
        this._container.appendChild(this._dom);
    }

    delete() {
        Database.deleteFolder(this._name)
        .then((res) => {
                this._clearSelection();
                this._dom.remove();
                NotesContainer.hide();
            }, (err) => {console.log(err);}
        )
    }

}

class Note {
    constructor(name) {
        this._name = name;
        this._body = null;
        this._container = document.getElementById('all-notes');
        this._dom = this._render();
    }

    _render() {
        const note = document.createElement('div');
        note.className = 'note clickable';
        note.textContent = this._name;
        note.datalist['name'] = this._name;
        // note.addEventListener('click', this._clickCallback());
        return note;
    }

    display() {
        this._container.appendChild(this._dom);
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
    if (!Globals.selections.folder.isEmpty()) {
        Globals.selections.folder.delete();
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
                (new Folder(name)).display();
                document.getElementById('add-folder-input').blur();
            }, (err) => {console.log(err);}
        );
    };
});

Database.getAllFolders()
.then((names) => {
        names.forEach(n => (new Folder(n)).display());
    }, (err) => {console.log(err);}
);