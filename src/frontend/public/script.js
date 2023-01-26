
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
        folder.className = 'folder';
        const folder_name = document.createElement('div');
        folder_name.textContent = name;
        folder.appendChild(folder_name);
        folder.addEventListener('click', this.selectFolder.bind(folder))
        return folder;
    };

    static selectFolder() {
        if (Globals.selectedFolder) {
            Globals.selectedFolder.classList.remove('selected');
        };
        this.classList.add('selected');
        Globals.selectedFolder = this;
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

document.getElementById('add-folder-button').addEventListener('click', () => {
    const addFolderInput = document.getElementById('add-folder-input');
    addFolderInput.style.visibility = 'visible';
    addFolderInput.focus();
});

document.getElementById('add-folder-input').addEventListener('focusout', (event) => {
    event.preventDefault();
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
