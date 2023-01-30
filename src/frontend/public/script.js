
const root = 'http://localhost:3000';

class Selection {

    constructor() {
        this.elem = null;
    }

    _isEmpty() {
        return this.elem === null
    }

    select(elem) {
        this.clear();
        elem.classList.add('selected');
        this.elem = elem;
    }

    clear() {
        if (!this._isEmpty()) {
            this.elem.classList.remove('selected');
        }
        this.elem = null;
    }
}

const selections = {
    folder: new Selection(),
    note: new Selection()
}

class Database {

    static getAllFolders() {
        return fetch(`${root}/folders/`).then(
            async (res) => {
                if (!res.ok) {
                    Promise.reject(new Error('Server error'));
                } else {
                    return await res.json();
                };
            }, 
            (err) => {
                Promise.reject(err);
            }
        );
    };

    static addFolder(name) {
        return fetch(`${root}/folders/${name}`, {method: 'POST'}).then(
            async (res) => {
                if (!res.ok) {
                    if (res.status === 400) {
                        var message = (await res.json()).message
                        alert(message);
                        return Promise.reject(new Error(message));
                    } else {
                        return Promise.reject(new Error('Server errror'));
                    }
                } else {
                    return Promise.resolve(name);
                }
            },
            (err) => {
                return Promise.reject(err);
            }
        )
    };

    static getNotesForFolder(folder_name) {
        const options = {method: 'GET'};
        return fetch(`${root}/folders/${folder_name}`, options).then(
            async (res) => {
                if (!res.ok) {
                    Promise.reject(new Error('Server error'));
                } else {
                    return await res.json();
                }
            },
            (err) => {
                Promise.reject(err);
            }
        );
    }

    static deleteSelectedFolder() {
        const options = {method: 'DELETE'};
        return fetch(`${root}/folders/${Globals.selectedFolder.textContent}`, options).then(
            (res) => {
                if (!res.ok) {
                    return Promise.reject(new Error('Server error'))
                };
            }, 
            (err) => {
                return Promise.reject(err);
            }
        );
    };
}

class Folder {

    constructor(name) {
        this._name = name;
        this._container = document.getElementById('all-folders');
        this._dom = this._makeDom();
    }

    _clickCallback() {
        return () => {
            selections.folder.select(this._dom);
            Database.getNotesForFolder(this._name).then(
                (names) => {
                    console.log(names)
                },
                (err) => {
                    console.log(err);
                }
            )
        }
    }

    _makeDom() {
        const folder = document.createElement('div');
        folder.className = 'folder clickable';
        folder.textContent = this._name;
        folder.addEventListener('click', this._clickCallback());
        return folder;
    }

    display() {
        this._container.appendChild(this._dom);
    }

    select() {
        if (Globals.selectedFolder) {
            Globals.selectedFolder.classList.remove('selected');
        };
        this._dom.classList.add('selected');
        Globals.selectedFolder = this._dom;
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
    if (Selectables.folder.isSelected()) {
        Database.deleteSelectedFolder().then(
            (res) => Display.removeSelectedFolder(),
            (err) => {console.log(err)}
        );
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
        Database.addFolder(event.target.value)
        .then(
            (name) => {
                console.log(name);
                Display.displayFolder(name);
                document.getElementById('add-folder-input').blur();
            },
            (err) => {
                console.log(err)
            }
        );
    };
});

Database.getAllFolders().then(
    (names) => {
        names.forEach(n => (new Folder(n)).display());
    },
    (err) => {
        console.log(err);
    }
);
