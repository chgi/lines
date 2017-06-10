(function () {
    'use strict';

    const storageKey = "lines";

    const defaultSettings = {
        // animation speed settings
        skipFrames: 4,   // animate only ever (n+1)th frame
        stepSize: 1,     // scale factor for point speeds
        fadeSpeed: 0.05, // speed of fading (0..1)
        numPoints: 8,    // points to start with
        vMin: 0.1,       // min speed
        vMax: 3,        // max speed
        vChange: 0.2,    // speed change magnitude

        // colors
        sMin: 55,        // min saturation %
        sMax: 100,       // max saturation %
        lMin: 45,        // min limunosity %
        lMax: 80,        // max limunosity %
        colorSpeed: 10,  // speed of color change

        messagePos: { x: 20, y: 40 }, // start position for messages
        messageHeight: 30,            // message line height
        messageFont: "20px Serif",    // message font
        messageColor: "#AAA",         // message color
        messageDuration: 50           // message default diplay time (animation steps)
    }

    const canvas = document.getElementById("content"),
        ctx = canvas.getContext("2d");

    let w, h,
        skipCounter = 0,
        points = [],
        messages = [],
        animation
        ;

    let settings;

    function loadDefaultSettings() {
        flashMessage("restoring default settings");
        settings = Object.assign({}, defaultSettings);
        setSkipFrames(settings.skipFrames);
        setFadeSpeed();
    }

    function loadSettings(key = "default") {

        const s = localStorage.getItem(`${storageKey}_${key}`);

        if (!s) {
            flashMessage("no saved settings");
            return;
        }


        flashMessage(`restoring settings from localStorage (${key})`);

        settings = Object.assign({}, defaultSettings, JSON.parse(s));
        points = createPointsArray(settings.numPoints);

        setSkipFrames(settings.skipFrames);
        setFadeSpeed();
    }

    function saveSettings(key = "default") {
        localStorage.setItem(`${storageKey}_${key}`, JSON.stringify(settings));
        flashMessage(`saved settings to localStorage (${key})`);
    }

    function init() {
        updateCanvas();

        loadDefaultSettings();
        points = createPointsArray(settings.numPoints);

        window.addEventListener("resize", updateCanvas);
        window.addEventListener("keydown", keyDownHandler);

        animation = requestAnimationFrame(animationStep);
    }

    function createPointsArray(numberOfPoints) {
        const points = [];

        for (let i = 0; i < numberOfPoints; ++i) {
            points.push(createPoint());
        }
        points.push(points[0]);

        return points;
    }

    function updateCanvas() {
        w = canvas.width = canvas.clientWidth;
        h = canvas.height = canvas.clientHeight;

        ctx.fillStyle = "rgb(0,0,0)";
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.fillRect(0, 0, w, h);
    }

    function setFadeSpeed(fs) {
        const oldFs = settings.fadeSpeed,
            newFs = clamp(fs || settings.fadeSpeed, 0.01, 1);
        
        settings.fadeSpeed = newFs;
        ctx.fillStyle = `rgba(0,0,0,${newFs})`;
        return newFs !== oldFs;
    }

    function setSkipFrames(sf) {
        let oldSf = settings.skipFrames,
            newSf = clamp(sf, 0, 10);
        settings.skipFrames = newSf;
        return newSf !== oldSf;
    }

    function flashMessage(text, duration) {
        if (!settings) return;

        const last = messages[messages.length - 1],
            { messagePos, messageDuration, messageHeight } = settings,
            newY = last && last.position && last.position.y && last.position.y + messageHeight;

        const position = {
            x: messagePos.x,
            y: (newY && newY < h) ? newY : messagePos.y
        }

        messages.push({
            text,
            duration: duration || messageDuration,
            position
        });
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

    function keyDownHandler(e) {

        switch (e.key) {
            case "+":
                if (settings.numPoints < 100) {
                    points.splice(points.length - 1, 0, createPoint());
                    ++settings.numPoints;
                    flashMessage(`point added (now ${settings.numPoints})`);
                }
                break;

            case "-":
                if (settings.numPoints > 2) {
                    points.splice(points.length - 2, 1);
                    --settings.numPoints;
                    flashMessage(`point removed (${settings.numPoints} remain)`);
                }
                break;

            case "*":
                if (setFadeSpeed(settings.fadeSpeed + 0.01)) {
                    flashMessage(`increased fade speed to ${Math.round(settings.fadeSpeed * 1000) / 10}`);
                }
                break;

            case "/":
                if (setFadeSpeed(settings.fadeSpeed - 0.01)) {
                    flashMessage(`decreased fade speed to ${Math.round(settings.fadeSpeed * 1000) / 10}`);
                }
                break;

            case "PageUp":
                if (setSkipFrames(settings.skipFrames + 1)) {
                    flashMessage(`increased skip frames to ${settings.skipFrames}`);
                }
                break;

            case "PageDown":
                if (setSkipFrames(settings.skipFrames - 1)) {
                    flashMessage(`decreased skip frames to ${settings.skipFrames}`);
                }
                break;

            case "ArrowUp":
                if (settings.vMin < 10) {
                    settings.vMin += 0.2;
                    settings.vMax += 0.2;
                    flashMessage(`increased speed to [${settings.vMin}, ${settings.vMax}]`);
                }
                break;

            case "ArrowDown":
                if (settings.vMin >= .3) {
                    settings.vMin -= 0.2;
                    settings.vMax -= 0.2;
                    flashMessage(`decreased speed to [${settings.vMin}, ${settings.vMax}]`);
                }
                break;

            case "ArrowLeft":
                if (settings.vChange > 0) {
                    settings.vChange = Math.max(settings.vChange - 0.1, 0);
                    flashMessage(`decreased speed change to ${settings.vChange}`);
                }
                break;

            case "ArrowRight":
                if (settings.vChange < 2) {
                    settings.vChange = Math.min(settings.vChange + 0.1, 2);
                    flashMessage(`increased speed change to ${vChange}`);
                }
                break;

            case "s":
            case "S":
                saveSettings();
                break;

            case "l":
            case "L":
                loadSettings();
                break;

            case "d":
            case "D":
                loadDefaultSettings();
                break;

            case " ":
                if (animation) {
                    cancelAnimationFrame(animation);
                    animation = 0;
                } else {
                    animation = requestAnimationFrame(animationStep);
                }
                break;

            default:
                flashMessage("unknown key", settings.messageDuration / 2);
                console.log(e.code, `"${e.key}"`);
                return;
        }

        e.preventDefault();
    }

    function createPoint() {
        let { vMin, vMax, sMin, sMax, lMin, lMax } = settings,
            p = Object.create(null);

        p.x = Math.random() * w;
        p.y = Math.random() * h;
        p.vx = vMin + Math.random() * (vMax - vMin);
        p.vy = vMin + Math.random() * (vMax - vMin);
        p.h = Math.random() * 360;
        p.s = Math.random() * (sMax - sMin) + sMin;
        p.l = Math.random() * (lMax - lMin) + lMin;
        p.h_dir = Math.sign(Math.random() - 0.5);
        p.s_dir = Math.sign(Math.random() - 0.5);
        p.l_dir = Math.sign(Math.random() - 0.5);

        return p;
    }

    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), max);
    }

    function stepAndGetColor(point) {
        const { colorSpeed, sMin, sMax, lMin, lMax } = settings;
        let { h, s, l, h_dir, s_dir, l_dir } = point;

        h = clamp(h + h_dir * Math.random() * colorSpeed, 0, 360);
        s = clamp(s + s_dir * Math.random() * colorSpeed, sMin, sMax);
        l = clamp(l + l_dir * Math.random() * colorSpeed, lMin, lMax);

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

    function changeSpeed(point) {
        const { vChange, vMin, vMax } = settings;

        let { vx, vy } = point,
            v = Math.sqrt(vx * vx + vy * vy), // magnitude of velocity
            rawAngle = Math.acos(vx / v), // angle between (1, 0) and velocity
            angle,
            q = 0,
            rMin, rMax,
            pi = Math.PI,
            pi2 = Math.PI / 2;

        // determine the quadrant of rawAngle (acos in ambiguous)
        // origin is top left (I think)
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
        let scale = 1 + (Math.random() * vChange),
            rotation = Math.random() * pi2 + rMin,
            cosR = Math.cos(rotation),
            sinR = Math.sin(rotation);

        if (Math.random() > 0.5) scale = 1 / scale;

        // restrict scale so that resulting speed stays inside limits
        scale = Math.sqrt(clamp(v * scale, vMin, vMax) / v);

        // rotate and scale
        point.vx = scale * (vx * cosR + vy * sinR);
        point.vy = scale * (vy * cosR - vx * sinR);
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

    function animationStep() {
        animation = requestAnimationFrame(animationStep);

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
