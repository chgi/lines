/* 
    this will only work in recent browsers.
*/
(function () {
    'use strict';

    // localstorage key for storing settings
    const storageKey = "lines";

    // key bindings. 
    // single letters must be in uppercase,
    // but will work upper or lowercase.
    const keyMap = {

        unmodified: {
            "H": showMappedKeys,
            "+": () => changeNumberOfPoints(+1),
            "-": () => changeNumberOfPoints(-1),
            "*": () => changeFadeSpeed(+0.01),
            "/": () => changeFadeSpeed(-0.01),
            "PageUp": () => changeSkipFrames(+1),
            "PageDown": () => changeSkipFrames(-1),
            "ArrowUp": () => changeVMin(+.2),
            "ArrowDown": () => changeVMin(-.2),
            "ArrowLeft": () => changeVMax(-.2),
            "ArrowRight": () => changeVMax(+.2),
            "S": saveSettings,
            "L": loadSettings,
            "D": loadDefaultSettings,
            " ": togglePlayPause,
            "1": () => loadSettings("1"),
            "2": () => loadSettings("2"),
            "3": () => loadSettings("3"),
            "4": () => loadSettings("4"),
            "5": () => loadSettings("5"),
            "6": () => loadSettings("6"),
            "7": () => loadSettings("7"),
            "8": () => loadSettings("8"),
            "9": () => loadSettings("9"),
            "0": () => loadSettings("0"),
        },

        control: {
            "1": () => saveSettings("1"),
            "2": () => saveSettings("2"),
            "3": () => saveSettings("3"),
            "4": () => saveSettings("4"),
            "5": () => saveSettings("5"),
            "6": () => saveSettings("6"),
            "7": () => saveSettings("7"),
            "8": () => saveSettings("8"),
            "9": () => saveSettings("9"),
            "0": () => saveSettings("0"),
        },

        alt: {},
        meta: {}
    }

    // default settings. loaded on startup.
    const defaultSettings = {
        // animation speed settings
        skipFrames: 4,   // animate only ever (n+1)th frame
        stepSize: 1,     // scale factor for point speeds
        fadeSpeed: 0.05, // speed of fading (0..1)
        numPoints: 8,    // points to start with
        vMin: 0.3,       // min speed
        vMax: 3,         // max speed
        vChange: 0.2,    // speed change magnitude

        // colors
        sMin: 55,        // min saturation %
        sMax: 100,       // max saturation %
        lMin: 45,        // min limunosity %
        lMax: 80,        // max limunosity %
        colorSpeed: 10,  // speed of color change

        messagePos: { x: 20, y: 40 }, // start position for messages
        messageHeight: 30,            // message line height
        messageWidth: 200,            // message column width
        messageFont: "20px Serif",    // message font
        messageColor: "#AAA",         // message color
        messageDuration: 50           // message default diplay time (animation steps)
    }

    const canvas = document.getElementById("content"),
        ctx = canvas.getContext("2d");

    // application state
    let w, h,
        skipCounter = 0,
        points = [],
        messages = [],
        play = false,
        settings;

    function loadDefaultSettings() {
        flashMessage("restoring default settings");
        settings = Object.assign({}, defaultSettings);
        points = createPointsArray(settings.numPoints);
        changeFadeSpeed();
    }

    // load saved settings from localstorage
    function loadSettings(key = "default") {

        const s = localStorage.getItem(`${storageKey}_${key}`);

        if (!s) {
            flashMessage(`no saved settings in slot ${key}. press ctrl-${key} to save.`);
            return;
        }

        flashMessage(`restoring settings from localStorage (slot ${key})`);

        settings = Object.assign({}, defaultSettings, JSON.parse(s));
        points = createPointsArray(settings.numPoints);

        changeFadeSpeed();
    }

    // save settings to localstorage
    function saveSettings(key = "default") {
        localStorage.setItem(`${storageKey}_${key}`, JSON.stringify(settings));
        flashMessage(`saved settings to localStorage (slot ${key})`);
    }

    // get everything started
    function init() {
        updateCanvas();
        loadDefaultSettings();

        points = createPointsArray(settings.numPoints);

        window.addEventListener("resize", updateCanvas);
        window.addEventListener("keydown", keyDownHandler);
        window.addEventListener("click", clickHandler);

        togglePlayPause();

        flashMessage("try pressing \"h\"...", 500);
    }

    // update the internal state when the canvas is first used or resized
    function updateCanvas() {
        w = canvas.width = canvas.clientWidth;
        h = canvas.height = canvas.clientHeight;

        ctx.fillStyle = "rgb(0,0,0)";
        ctx.fillRect(0, 0, w, h);

        changeFadeSpeed();
    }

    function clearMessages() {
        messages = [];
    }

    // display a fading message on screen
    function flashMessage(text, duration) {
        if (!settings) return;

        const last = messages[messages.length - 1],
            { messagePos, messageDuration, messageHeight, messageWidth } = settings,
            lastX = last && last.position.x || messagePos.x,
            lastY = last && last.position.y || (messagePos.y - messageHeight),
            wrap = (lastY + messageHeight) > h;

        const position = {
            x: wrap ? (lastX + messageWidth) : lastX,
            y: wrap ? messagePos.y : (lastY + messageHeight)
        };

        messages.push({
            text,
            duration: duration || messageDuration,
            position
        });
    }

    // display the mapped keys as a message on screen
    function showMappedKeys() {
        clearMessages();

        Object.keys(keyMap)
            .forEach(mod => {
                Object.keys(keyMap[mod])
                    .forEach(key => {
                        const prefix = (mod === 'unmodified' ? "" : mod + " + "),
                            keyString = key === " " ? "Space" : key;
                        flashMessage(`${prefix}${keyString}`, 200)
                    });
            });
    }

    function createPointsArray(numberOfPoints) {
        const points = [];

        for (let i = 0; i < numberOfPoints; ++i) {
            points.push(createPoint());
        }
        points.push(points[0]);

        return points;
    }

    function changeFadeSpeed(deltaFadeSpeed = 0) {

        if (!settings) return;

        const oldFs = settings.fadeSpeed,
            newFs = clamp(oldFs + deltaFadeSpeed, 0.01, 1);

        settings.fadeSpeed = newFs;
        ctx.fillStyle = `rgba(0,0,0,${newFs})`;

        if (newFs !== oldFs) {
            flashMessage(`${deltaFadeSpeed > 0 ? "increased" : "decreased"} fade speed to ${Math.round(settings.fadeSpeed * 1000) / 10}`);
        }
    }

    function changeSkipFrames(deltaSkipFrames = 0) {
        if (deltaSkipFrames === 0) return;

        const oldSf = settings.skipFrames,
            newSf = clamp(oldSf + deltaSkipFrames, 0, 10);

        settings.skipFrames = newSf;

        if (newSf !== oldSf) {
            flashMessage(`${newSf > oldSf ? "increased" : "decreased"} skip frames to ${settings.skipFrames}`);
        }
    }

    function changeNumberOfPoints(deltaNumPoints = 0) {

        if (deltaNumPoints === 0) return;

        const add = deltaNumPoints > 0,
            msg = `${deltaNumPoints} ${deltaNumPoints > 1 ? "point" : "points"} ${add ? "added" : "removed"} (now ${settings.numPoints})`;

        deltaNumPoints = Math.abs(clamp(settings.numPoints + deltaNumPoints, 2, 100) - settings.numPoints);

        if (add) {
            while (--deltaNumPoints >= 0) {
                points.splice(points.length - 1, 0, createPoint());
                ++settings.numPoints;
            }
        } else {
            points.splice(points.length - deltaNumPoints - 1, deltaNumPoints);
            settings.numPoints -= deltaNumPoints;
        }
        flashMessage(msg);
    }

    function changeVMin(deltaVMin = 0) {

        deltaVMin = clamp(settings.vMin + deltaVMin, .3, 10) - settings.vMin;

        if (deltaVMin === 0) return;

        settings.vMin += deltaVMin;

        for (let i = 0; i < settings.numPoints; ++i) {
            let curr = points[i];
            curr.vx = Math.max(settings.vMin, curr.vx);
            curr.vy = Math.max(settings.vMin, curr.vy);
        }

        flashMessage(`${deltaVMin > 0 ? "increased" : "decreased"} minimum speed to ${settings.vMin}`);
    }

    function changeVMax(deltaVMax = 0) {

        deltaVMax = clamp(settings.vMax + deltaVMax, 3, 30) - settings.vMax;

        if (deltaVMax === 0) return;

        settings.vMax += deltaVMax;

        for (let i = 0; i < settings.numPoints; ++i) {
            let curr = points[i];
            curr.vx = Math.min(settings.vMax, curr.vx);
            curr.vy = Math.min(settings.vMax, curr.vy);
        }

        flashMessage(`${deltaVMax > 0 ? "increased" : "decreased"} maximum speed to ${settings.vMax}`);
    }

    function changeVChange(deltaVChange = 0) {
        if (deltaVChange === 0) return;

        settings.vChange += clamp(settings.vChange + deltaVChange, 0, 5) - deltaVChange;
    }

    function clickHandler(e) {
        const { altKey, ctrlKey, metaKey, shiftKey, button, which } = e;

        if (altKey || ctrlKey || metaKey || shiftKey) return;

        if (button === 0 || which === 1) {
            togglePlayPause();
        }
    }

    function keyDownHandler(e) {

        const key = e.key.length > 1 ? e.key : e.key.toUpperCase(),
            modifier = e.ctrlKey ? "control" : e.metaKey ? "meta" : e.altKey ? "alt" : "unmodified",
            handlerMap = keyMap[modifier],
            handler = handlerMap[key];

        if (key === "Alt" || key === "Control" || key === "Meta" || key === "Shift") {
            return;
        }

        if (handlerMap.hasOwnProperty(key) && typeof handler === 'function') {
            e.preventDefault();
            handler();
        } else {
            flashMessage("unknown key", settings.messageDuration / 2);
            console.log(e.code, `"${e.key}"`);
        }
    }

    function direction() {
        return Math.sign(Math.random() - 0.5);
    }

    function random(min = 0, max = 1) {
        return min + Math.random() * (max - min)
    }

    function createPoint() {
        let { vMin, vMax, sMin, sMax, lMin, lMax } = settings,
            p = Object.create(null);

        p.x = random(0, w);
        p.y = random(0, h);
        p.vx = random(vMin, vMax) * direction();
        p.vy = random(vMin, vMax) * direction();
        p.h = random(0, 360);
        p.s = random(sMin, sMax);
        p.l = random(lMin, lMax);
        p.h_dir = direction();
        p.s_dir = direction();
        p.l_dir = direction();

        return p;
    }

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function stepAndGetColor(point) {
        const { colorSpeed, sMin, sMax, lMin, lMax } = settings;
        let { h, s, l, h_dir, s_dir, l_dir } = point;

        h = clamp(h + h_dir * random(0, colorSpeed) , 0, 360);
        s = clamp(s + s_dir * random(0, colorSpeed), sMin, sMax);
        l = clamp(l + l_dir * random(0, colorSpeed), lMin, lMax);

        h_dir = h <= 0 ? 1 : h >= 360 ? -1 : h_dir;
        s_dir = s <= sMin ? 1 : s >= sMax ? -1 : s_dir;
        l_dir = l <= lMin ? 1 : l >= lMax ? -1 : l_dir;

        point.h = h;
        point.s = s;
        point.l = l;
        point.h_dir = h_dir;
        point.s_dir = s_dir;
        point.l_dir = l_dir;

        return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,1)`;
    }

    function changeSpeed(point) {
        const { vChange, vMin, vMax } = settings,
            { vx, vy } = point,
            v = Math.sqrt(vx * vx + vy * vy), // magnitude of velocity;
            rawAngle = Math.acos(vx / v), // angle between (1, 0) and velocity
            pi = Math.PI,
            pi2 = Math.PI / 2;

        let angle, rMin, rMax, q = 0;

        // determine the quadrant of rawAngle (acos in ambiguous)
        // origin is top left
        if (vy > 0) {
            angle = 2 * pi - rawAngle;
            q = vx > 0 ? 4 : 3;
        } else {
            angle = rawAngle;
            q = vx > 0 ? 1 : 2;
        }

        // rMin, rMax: rotations to reach the quadrant edges
        // invariant: rMin - rMax === pi / 2
        switch (q) {
            case 1:
                rMin = -angle;
                rMax = pi2 - angle;
                break;

            case 2:
                rMin = pi2 - angle;
                rMax = pi - angle;
                break;

            case 3:
                rMin = pi - angle;
                rMax = 3 * pi2 - angle;
                break;

            case 4:
                rMin = 3 * pi2 - angle;
                rMax = 2 * pi - angle;
                break;

            default:
                throw new RangeError(`quadrant of angle can not be ${q}`);
        }

        // randomly select scale
        // randomly change angle so that it stays in the same quadrant
        let scale = 1 + random(0, vChange),
            rotation = random(0, pi2) + rMin,
            cosR = Math.cos(rotation),
            sinR = Math.sin(rotation);

        if (random() > 0.5) scale = 1 / scale;

        // restrict scale so that resulting speed stays inside limits
        scale = Math.sqrt(clamp(v * scale, vMin, vMax) / v);

        // rotate and scale
        point.vx = scale * (vx * cosR + vy * sinR);
        point.vy = scale * (vy * cosR - vx * sinR);
    }

    function movePoints() {
        let { numPoints, stepSize } = settings;

        for (let i = 0; i < numPoints; ++i) {
            let current = points[i];

            current.x += current.vx * stepSize;
            current.y += current.vy * stepSize;

            if (current.x <= 0) {
                current.x = 0;
                current.vx *= -1;
                changeSpeed(current);
            }

            if (current.x >= w) {
                current.x = w;
                current.vx *= -1;
                changeSpeed(current);
            }

            if (current.y <= 0) {
                current.y = 0;
                current.vy *= -1;
                changeSpeed(current);
            }

            if (current.y >= h) {
                current.y = h;
                current.vy *= -1;
                changeSpeed(current);
            }
        }
    }

    function paintPoints() {
        const { numPoints } = settings,
            colors = points.map(stepAndGetColor);

        for (let i = 0; i < numPoints; ++i) {
            const { x: x0, y: y0 } = points[i],
                { x: x1, y: y1 } = points[i + 1],
                grad = ctx.createLinearGradient(x0, y0, x1, y1);

            grad.addColorStop(0, colors[i]);
            grad.addColorStop(1, colors[i + 1]);
            ctx.strokeStyle = grad;

            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        }
    }

    function paintMessages() {
        let { messageColor, messageFont } = settings;

        ctx.save();

        ctx.fillStyle = messageColor;
        ctx.font = messageFont;

        messages = messages.filter(current => {
            const { text, position, duration } = current;

            if (duration > 0) {
                ctx.fillText(text, position.x, position.y);
            }

            return (--current.duration > -10);
        });

        ctx.restore();
    }

    function togglePlayPause() {
        play = !play;

        if (play) {
            requestAnimationFrame(animationStep);
        } else {
            clearMessages();
            flashMessage("Paused", 1);
        }
    }

    function animationStep() {
        if (play) {
            requestAnimationFrame(animationStep);
        }

        movePoints();
        ctx.fillRect(0, 0, w, h);

        if (++skipCounter > settings.skipFrames) {
            skipCounter = 0;
            paintPoints();
        }

        paintMessages();
    }

    init();
}());
