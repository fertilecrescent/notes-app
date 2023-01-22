
const root = 'http://localhost:3000';

function getAllFolders() {
    return fetch(`${root}/folders/`).then(
        async (res) => {
            if (!res.ok) {
                alert(res.statusText);
            } else {
                return res.json();
            };
        }, 
        (error) => {
            alert(error.message);
        }
    )
};

class Display {

    static displayFolders(folder_docs) {
        var container = document.getElementById('folder-container');
        for (var doc of folder_docs) {
            this.addFolder(doc.name, container);
        }
    }

    static addFolder(name, container) {
        var folder = this.makeFolder(name);
        container.appendChild(folder);
    }

    static makeFolder(name) {
        const folder = document.createElement('div');
        folder.className = 'folder';
        const folder_name = document.createElement('div');
        folder_name.textContent = name;
        folder.appendChild(folder_name);
        return folder;
    };

    static deleteSelectedFolder() {};

}

getAllFolders().then(
    (folder_docs) => {
        Display.displayFolders(folder_docs);
    },
    (error) => alert(error.message)
);

