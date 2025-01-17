// ==UserScript==
// @name         OGPhal
// @namespace    https://webapp-universe.net/
// @version      0.1
// @description  Surveilles vos phalanges sur ogame
// @author       HattaTea
// @match        https://www.s*-*.ogame.gameforge.com/game/index.php?page=ingame&component=galaxy*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Fonction à exécuter lorsque la div est mise à jour
    function onPhalUpdated() {
        let actualClock = document.getElementsByClassName('OGameClock')[0].textContent.split(' ')[1]
        let allMissionDetails = [];

        let target = null

        ogp_node.querySelectorAll('div').forEach(element => {
            let missionDetails = {
                slotid: element.getAttribute('id'),
                missiontype: element.getAttribute('data-mission-type'),
                arrivaltime: null,
                coordsOrigin: null,
                destCoords: null,
                baseSpeed: null,
                detailsFleet: null
            };
    
            element.querySelectorAll('li').forEach(detail => {
                if (detail.getAttribute('class') === 'arrivaltime') {
                    missionDetails.arrivaltime = detail.textContent.trim();
                }
                if (detail.getAttribute('class') === 'coordsOrigin') {
                    missionDetails.coordsOrigin = detail.textContent.trim();
                }
                if (detail.getAttribute('class') === 'destCoords') {
                    missionDetails.destCoords = detail.textContent.trim();
                    if (target === null) {
                        target = detail.textContent.trim();
                    };
                }
                if (detail.getAttribute('class') === 'baseSpeed') {
                    missionDetails.baseSpeed = detail.textContent.trim();
                }
                if (detail.getAttribute('class') === 'detailsFleet') {
                    missionDetails.detailsFleet = detail.textContent.trim();
                }
            });

            allMissionDetails.push(missionDetails);
        });

        let serverTarget = localStorage.getItem('serverUrlOGP');
        if (serverTarget) {
            GM_xmlhttpRequest({
                method: 'POST',
                url: serverTarget,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({
                    coord: target,
                    clock: actualClock,
                    datas: allMissionDetails
                }),
                onload: function(response) {
                    configButtonOGP.style.backgroundColor = "green";
                    setTimeout(function() {
                        configButtonOGP.style.backgroundColor = "blue";
                    }, 2000);
                },
                onerror: function (error) {
                    configButtonOGP.style.backgroundColor = "green";
                    setTimeout(function() {
                        configButtonOGP.style.backgroundColor = "red";
                    }, 2000);
                }
            });
        };
    }

    // Surveillance de la Phalange
    const ogp_node = document.getElementById('phalanxEventContent');  

    if (ogp_node) {
        const config = { childList: true, subtree: true };
        const observer = new MutationObserver(function(mutationsList, observer) {
            mutationsList.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    onPhalUpdated();
                }
            });
        });
        observer.observe(ogp_node, config);
    }

   // Création du contenu du popup de configuration
    let popup_ogp = `
    <div id="ogp-popup" style="display: none; position: fixed; top: 20%; left: 50%; transform: translateX(-50%); padding: 20px; background-color: white; border: 1px solid black; z-index: 1000;">
        <label for="server-url">Url du serveur : </label>
        <input type="text" id="server-url" placeholder="Entrez l'URL du serveur" />
        <button id="ogp-save-btn">Valider</button>
        <button id="ogp-close-btn">Fermer</button>
    </div>
    `;

    // Fonction pour ouvrir le pop-up
    function config_ogp(event) {
        // Affiche le popup
        document.body.insertAdjacentHTML('beforeend', popup_ogp);
        document.getElementById('ogp-popup').style.display = 'block';

        // Ajout des événements
        document.getElementById('ogp-save-btn').addEventListener('click', save_ogp);
        document.getElementById('ogp-close-btn').addEventListener('click', close_config_ogp);
    }

    // Fonction pour fermer le pop-up
    function close_config_ogp(event) {
        let popup = document.getElementById('ogp-popup');
        if (popup) {
            popup.style.display = 'none';
            popup.remove();
        }
    }

    // Fonction pour sauvegarder la configuration
    function save_ogp(event) {
        let serverUrl = document.getElementById('server-url').value;

        if (serverUrl) {
            // Sauvegarde la configuration dans le localStorage
            localStorage.setItem('serverUrlOGP', serverUrl);
            alert('URL du serveur sauvegardée !');

            close_config_ogp();
        } else {
            alert('Veuillez entrer une URL valide.');
        }
    }

    // Ajouter un bouton de configuration dans le header
    let parentHead = document.getElementsByName('galaform')[0];
    if (parentHead) {
        const configButtonOGP = document.createElement('button');
        configButtonOGP.textContent = 'OGP';
        configButtonOGP.name = 'ogp_config';
        configButtonOGP.style.backgroundColor = "blue"
        configButtonOGP.addEventListener('click', config_ogp);
        parentHead.appendChild(configButtonOGP);
    }
})();