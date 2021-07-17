/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

'use strict';

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

class Extension {
    constructor() {
        this._indicator = null;
        this._icon = null;

        this._perfIcon =  new Gio.ThemedIcon({name: 'media-skip-forward-symbolic'});
        this._balanceIcon = new Gio.ThemedIcon({name: 'media-seek-forward-symbolic'});
        this._powerIcon = new Gio.ThemedIcon({name: 'media-playback-start-symbolic'});
    }

    enable() {
        log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);

        let indicatorName = `${Me.metadata.name} Indicator`;

        this._indicator = new PanelMenu.Button(0.0, indicatorName, false);


        let icon = new St.Icon({
            gicon: new Gio.ThemedIcon({name: 'face-laugh-symbolic'}),
            style_class: 'system-status-icon'
        });
        this._icon = icon;
        this._indicator.add_child(icon);
        this._indicator.menu.addAction('Performance Mode', () => this.changeMode('performance'), null);
        this._indicator.menu.addAction('Balanced Mode', () => this.changeMode('balanced'), null);
        this._indicator.menu.addAction('Powersaver Mode', () => this.changeMode('power-saver'), null);



        this._subscription_identifier = Gio.DBus.system.signal_subscribe(
            'net.hadess.PowerProfiles',
            'org.freedesktop.DBus.Properties',
            'PropertiesChanged',
            '/net/hadess/PowerProfiles',
            null,
            Gio.DBusSignalFlags.NONE,
            () => {
                this.update_icon();
            }
        );

        this.update_icon();

        Main.panel.addToStatusArea(indicatorName, this._indicator);
    }

    disable() {
        log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);

        this._indicator.destroy();
        this._indicator = null;
        Gio.DBus.system.singal_unsubscribe(this._subscription_identifier);
    }

    update_icon() {
        Gio.DBus.system.call(
            'net.hadess.PowerProfiles',
            '/net/hadess/PowerProfiles',
            'org.freedesktop.DBus.Properties',
            'Get',
            new GLib.Variant('(ss)', [
                'net.hadess.PowerProfiles',
                'ActiveProfile',
            ]),
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (connection, res) => {
                try {
                    let r = connection.call_finish(res);
                    let mode = r.get_child_value(0).get_variant().get_string()[0];
                    switch (mode) {
                        case 'performance':
                            this._icon.set_gicon(this._perfIcon);
                            break;
                       case 'balanced':
                           this._icon.set_gicon(this._balanceIcon);
                           break;
                       case 'power-saver':
                           this._icon.set_gicon(this._powerIcon);
                       default:
                           break;
                    }
                } catch (e) {
                    logError(e);
                }
            }
        );     
    }


    changeMode(mode) {
        Gio.DBus.system.call(
            'net.hadess.PowerProfiles',
            '/net/hadess/PowerProfiles',
            'org.freedesktop.DBus.Properties',
            'Set',
            new GLib.Variant('(ssv)', [
                             'net.hadess.PowerProfiles',
                             'ActiveProfile',
                             new GLib.Variant('s', mode)
            ]),
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (connection, res) => {
                try {
                    connection.call_finish(res);
                    this.update_icon();
                } catch (e) {
                    logError(e);
                }
            }
        );
    }
}

function init() {
    log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);

    return new Extension();
}
