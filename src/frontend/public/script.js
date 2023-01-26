
const root = 'http://localhost:3000';
var Globals = {
    selectedFolder: null
};

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

class Display {

    static displayAllFolders(folder_docs) {
        var container = document.getElementById('all-folders');
        for (var doc of folder_docs) {
            this.addFolder(doc.name, container);
        };
    };

    static displayFolder(name) {
        var container = document.getElementById('all-folders');
        this.addFolder(name, container);
    };

    static addFolder(name, container) {
        var folder = this.makeFolder(name);
        container.appendChild(folder);
    };

    static makeFolder(name) {
        const folder = document.createElement('div');
        folder.className = 'folder clickable';
        const folder_name = document.createElement('div');
        folder_name.textContent = name;
        folder.appendChild(folder_name);
        folder.addEventListener('click', () => this.selectFolder(folder))
        return folder;
    };

    static selectFolder(folder) {
        if (Globals.selectedFolder) {
            Globals.selectedFolder.classList.remove('selected');
        };
        folder.classList.add('selected');
        Globals.selectedFolder = folder;
    };

    static removeSelectedFolder() {
        if (Globals.selectedFolder) {
            Globals.selectedFolder.classList.remove('selected');
            Globals.selectedFolder.remove();
        };
    };
}

Database.getAllFolders().then(
    (folder_docs) => {
        Display.displayAllFolders(folder_docs);
    },
    (err) => {
        console.log(err);
    }
);

document.getElementById('delete-folder-button').addEventListener('click', () => {
    if (Globals.selectedFolder) {
        Database.deleteSelectedFolder().then(
            (res) => Display.removeSelectedFolder(),
            (err) => {console.log(err)}
        );
    };
});

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

function deselectFolder() {
    Globals.selectedFolder.classList.remove('selected');
    Globals.selectedFolder = null;
}

document.addEventListener('click', (event) => {
    const deleteFolderButton = document.getElementById('delete-folder-button');
    const selectedFolder = Globals.selectedFolder;

    if (selectedFolder && 
    !(event.target === selectedFolder) && 
    !(event.target === deleteFolderButton)) {
        deselectFolder();
    }
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
