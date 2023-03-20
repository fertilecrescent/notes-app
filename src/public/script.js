
const root = 'http://localhost:3000';

const Globals = {
    awaitingServer: false,
    selectedFolder: null,
    selectedNote: null
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

    static async clear() {
        Database.updateNote(Globals.selectedFolder.name, Globals.selectedNote.name, this._container.value);
    };

    static hide() {
        this.clear();
        this._container.style.display = 'none';
    };

    static display(body) {
        this._container.value = body;
        this._container.style.display = 'block';
        this._container.focus();
    };
};

class Database {

    static getAllFolders() {
        Globals.awaitingServer = true;
        return fetch(`${root}/folders`)
        .then(async (res) => {
                if (!res.ok) {
                    Globals.awaitingServer = false;
                    Promise.reject(new Error(`Server error: status code ${res.status}`));
                } else {
                    const folders = await res.json();
                    Globals.awaitingServer = false;
                    return folders;
                };
            }, (err) => {return Promise.reject(err);}
        );
    };

    static addFolder(name) {
        return fetch(`${root}/${name}`, {method: 'POST'})
        .then(async (res) => {
                if (!res.ok) {
                    return Promise.reject(
                        new Error(`Server error: status code ${res.status}`)
                    );
                } else {
                    const resData = await res.json();
                    return Promise.resolve(resData);
                }
            }, (err) => {return Promise.reject(err);}
        )
    };

    static deleteFolder(id) {
        const options = {method: 'DELETE'};
        return fetch(`${root}/folders/${id}`, options)
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
        return fetch(`${root}/folder/notes/${folder.id}`, options)
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

    static addNote(name) {
        const options = {method: 'POST'};
        return fetch(`${root}/note/${name}`, options).then((res) => {
            if (res.ok) {return Promise.resolve(note);}
            else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {return Promise.reject(err);});
    }

    static updateNote(folder, note, body) {
        const options = {method: 'PUT'};
        return fetch(`${root}/${folder}/${note}?` + new URLSearchParams({body: body}), options).then(async (res) => {
            if (res.ok) {
                return Promise.resolve();
            } else {return Promise.reject(new Error(`Server error: status code ${res.status}`))}
        }, (err) => {console.log('fetch failed updating note');return Promise.reject(err)});
    };

    static deleteNote(folder, note) {
        const options = {method: 'DELETE'};
        return fetch(`${root}/${folder}/${note}`, options).then(
            (res) => {
                if (!res.ok) {return Promise.reject(new Error(`Server error: status code ${res.status}`));}
                else {return Promise.resolve();}
            }, (err) => {
                return Promise.reject(err)
            });
    };
};

class Folder {

    constructor(name, id) {
        this.name = name;
        this.id = id;
        this._container = document.getElementById('all-folders');
        this._dom = this._toDom();
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

    _toDom() {
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
        NotesController.display(this);
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
        Database.deleteFolder(this.id)
        .then(() => {
                this.clearSelection();
                this._dom.remove();
                NotesController.hide();
        }).catch((err) => console.error(err));
    };
}

class Note {
    constructor(folder_name, name, body) {
        this.folder_name = folder_name;
        this.name = name;
        this._body = body || '';
        this._container = document.getElementById('all-notes');
        this._dom = this._toDom();
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

    _toDom() {
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
        console.log(this._body, 'body');
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
        for (let folder of Array.from(document.getElementsByClassName('folder'))) {
            if (folder.dataset.name === event.target.value) {
                alert(`There is a already a folder named '${event.target.value}.'`
                + ' Please try again.')
                return
            }
        }
        Database.addFolder(event.target.value)
        .then((resData) => {
                const newFolder = new Folder(resData.name, resData.id);
                newFolder.select();
                newFolder.display();
                newFolder.scrollIntoView();
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
        for (let note of Array.from(document.getElementsByClassName('note'))) {
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
                newNote.scrollIntoView();
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

document.getElementById('text-area').addEventListener('change', (event) => {
    Globals.selectedNote._body = event.currentTarget.value;
});

function main() {
    addSpinner(document.getElementById('all-folders'));
    setTimeout(() => {
        Database.getAllFolders()
        .then((names) => {
                removeSpinner(document.getElementById('all-folders'));
                names.forEach(n => (new Folder(n)).display());
            }, (err) => {console.log(err);}
        );
    });
};

main();