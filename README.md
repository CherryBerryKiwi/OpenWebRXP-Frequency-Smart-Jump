# OpenWebRX+ Frequency Smart Jump Plugin 
## Written by ChatGPT with special support from Pham Hoang Thi - hoangthisd@gmail.com

## Overview

`frequency_smart_jump` is an OpenWebRX+ receiver plugin that improves frequency jumping behavior.

The plugin works together with a local `utils` plugin.

The loading chain is:

```
init.js
 |
 +--> utils
 |
 +--> frequency_smart_jump
```

You are free to enter any frequency within the entire range. The plugin automatically selects a matching SDR profile when the target frequency belongs to an available profile range. If no profile matches, the normal OpenWebRX+ frequency jump behavior is kept.

## Installation

Upload these files to /tmp/:

```
/tmp/utils.js
/tmp/frequency_smart_jump.js
```

Create plugin folders:

```bash
sudo mkdir -p /usr/lib/python3/dist-packages/htdocs/plugins/receiver/utils

sudo mkdir -p /usr/lib/python3/dist-packages/htdocs/plugins/receiver/frequency_smart_jump
```

Copy files:

```bash
sudo cp /tmp/utils.js \
/usr/lib/python3/dist-packages/htdocs/plugins/receiver/utils/

sudo cp /tmp/frequency_smart_jump.js \
/usr/lib/python3/dist-packages/htdocs/plugins/receiver/frequency_smart_jump/
```

## Create init.js

Create:

```
/usr/lib/python3/dist-packages/htdocs/plugins/receiver/init.js
```

Content:

```javascript
(async function() {

    await Plugins.load('utils');

    await Plugins.load('frequency_smart_jump');

})();
```

`init.js` is loaded as a normal script by OpenWebRX+, so `await` must be inside an async wrapper.

## Local utils dependency

If `frequency_smart_jump.js` contains a remote loader such as:

```javascript
await Plugins.load(
'https://0xaf.github.io/openwebrxplus-plugins/receiver/utils/utils.js'
);
```

remove it.

The `utils` plugin is now loaded locally by `init.js`.

The plugin may simply check:

```javascript
if (!Plugins.isLoaded('utils', 0.1)) {
    console.error('utils plugin missing');
    return false;
}
```

## File permissions

Set ownership:

```bash
sudo chown -R root:root \
/usr/lib/python3/dist-packages/htdocs/plugins/receiver
```

## Restart OpenWebRX+

```bash
sudo systemctl restart openwebrx
```

## Verify installation

Check files:

```bash
find /usr/lib/python3/dist-packages/htdocs/plugins/receiver -maxdepth 2 -type f
```

Expected:

```
plugins/receiver/init.js

plugins/receiver/utils/utils.js

plugins/receiver/frequency_smart_jump/frequency_smart_jump.js
```

## How to edit and update the code
1. Upload your version to /tmp/frequency_smart_jump.js
2. Copy and verify
```
sudo cp /tmp/frequency_smart_jump.js \
/usr/lib/python3/dist-packages/htdocs/plugins/receiver/frequency_smart_jump/
```
```
ls -l /usr/lib/python3/dist-packages/htdocs/plugins/receiver/frequency_smart_jump/
```
3. Permission
```
sudo chown root:root \
/usr/lib/python3/dist-packages/htdocs/plugins/receiver/frequency_smart_jump/frequency_smart_jump.js
```
4. Restart
```
sudo systemctl restart openwebrx
```

## Adding more plugins

For a new plugin, for example `abc`:

Create:

```
plugins/receiver/abc/
```

Place:

```
abc/abc.js
```

Then add to `init.js`:

```javascript
await Plugins.load('abc');
```

inside the async wrapper.

## Notes

This setup follows the OpenWebRX+ plugin structure:

- no modification of `plugins.js`
- no `/static` deployment
- no `/var/www` deployment
- plugins are loaded from the receiver plugin directory
