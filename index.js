(function () {
    'use strict';

    const storageKey = "myKey";

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

    let skipFrames = defaultSettings.skipFrames,
        stepSize = defaultSettings.stepSize,
        fadeSpeed = defaultSettings.fadeSpeed,
        numPoints = defaultSettings.numPoints,
        vMin = defaultSettings.vMin,
        vMax = defaultSettings.vMax,
        vChange = defaultSettings.vChange,
        sMin = defaultSettings.sMin,
        sMax = defaultSettings.sMax,
        lMin = defaultSettings.lMin,
        lMax = defaultSettings.lMax,
        colorSpeed = defaultSettings.colorSpeed,
        messagePos = defaultSettings.messagePos,
        messageHeight = defaultSettings.messageHeight,
        messageFont = defaultSettings.messageFont,
        messageColor = defaultSettings.messageColor,
        messageDuration = defaultSettings.messageDuration,
        w, h,
        skipCounter = 0,
        points = [],
        messages = [],
        animation
        ;

    function init() {
        updateCanvas();

        for (let i = 0; i < numPoints; ++i) {
            points.push(createPoint());
        }
        points.push(points[0]);

        window.addEventListener("resize", updateCanvas);
        window.addEventListener("keydown", keyDownHandler);

        animation = requestAnimationFrame(animationStep);
    }

    function updateCanvas() {
        w = canvas.width = canvas.clientWidth;
        h = canvas.height = canvas.clientHeight;

        ctx.fillStyle = "rgb(0,0,0)";
        ctx.strokeStyle = "rgba(255,255,255,1)";
        ctx.fillRect(0, 0, w, h);
        setFadeSpeed(fadeSpeed);
    }

    function loadSettings(settings) {

        if (!settings) {
            const s = localStorage.getItem(storageKey);

            if (!s) {
                flashMessage("no saved settings");
                return;
            }

            settings = JSON.parse(s);
            flashMessage(`restoring settings from localStorage (${storageKey})`);
        } else {
            flashMessage("restoring default settings");
        }

        // TODO: numPoints and other stuff

        if (numPoints > settings.numPoints) {
            points.splice(settings.numPoints, numPoints - settings.numPoints);
        } else if (numPoints < settings.numPoints) {
            for (let i = settings.numPoints - numPoints; i > 0; --i) {
                points.splice(numPoints - 1, 0, createPoint());
            }
        }
        numPoints = settings.numPoints;

        vMin = settings.vMin;
        vMax = settings.vMax;
        vChange = settings.vChange;
        setSkipFrames(settings.skipFrames);
        setFadeSpeed(settings.fadeSpeed);
    }

    function saveSettings() {
        const settings = {
            skipFrames: skipFrames,
            stepSize: stepSize,
            fadeSpeed: fadeSpeed,
            numPoints: numPoints,
            vMin: vMin,
            vMax: vMax,
            vChange: vChange,

            sMin: sMin,
            sMax: sMax,
            lMin: lMin,
            lMax: lMax,
            colorSpeed: colorSpeed,

            messagePos: Object.assign({}, messagePos),
            messageHeight: messageHeight,
            messageFont: messageFont,
            messageColor: messageColor,
            messageDuration: messageDuration
        }

        localStorage.setItem(storageKey, JSON.stringify(settings));
        flashMessage(`saved settings to localStorage (${storageKey})`);
    }

    function setFadeSpeed(fs) {
        let old = fadeSpeed;
        fadeSpeed = clamp(fs, 0.01, 1);
        ctx.fillStyle = `rgba(0,0,0,${fadeSpeed})`;
        return fadeSpeed !== old;
    }

    function setSkipFrames(sf) {
        let old = skipFrames;
        skipFrames = clamp(sf, 0, 10);
        return skipFrames !== old;
    }

    function flashMessage(text, duration) {
        const last = messages[messages.length - 1],
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
        ctx.save();

        ctx.fillStyle = messageColor;
        ctx.font = messageFont;

        messages = messages.filter(current => {
            const { text, position } = current;

            if (current.duration > 0) {
                ctx.fillText(text, position.x, position.y);
            }

            return (--current.duration > -10);
        });

        ctx.restore();
    }

    function keyDownHandler(e) {

        switch (e.key) {
            case "+":
                if (numPoints < 100) {
                    points.splice(points.length - 1, 0, createPoint());
                    ++numPoints;
                    flashMessage(`point added (now ${numPoints})`);
                }
                break;

            case "-":
                if (numPoints > 2) {
                    points.splice(points.length - 2, 1);
                    --numPoints;
                    flashMessage(`point removed (${numPoints} remain)`);
                }
                break;

            case "*":
                if (setFadeSpeed(fadeSpeed + 0.01)) {
                    flashMessage(`increased fade speed to ${Math.round(fadeSpeed * 1000) / 10}`);
                }
                break;

            case "/":
                if (setFadeSpeed(fadeSpeed - 0.01)) {
                    flashMessage(`decreased fade speed to ${Math.round(fadeSpeed * 1000) / 10}`);
                }
                break;

            case "PageUp":
                if (setSkipFrames(skipFrames + 1)) {
                    flashMessage(`increased skip frames to ${skipFrames}`);
                }
                break;

            case "PageDown":
                if (setSkipFrames(skipFrames - 1)) {
                    flashMessage(`decreased skip frames to ${skipFrames}`);
                }
                break;

            case "ArrowUp":
                if (vMin < 10) {
                    vMin += 0.2;
                    vMax += 0.2;
                    flashMessage(`increased speed to [${vMin}, ${vMax}]`);
                }
                break;

            case "ArrowDown":
                if (vMin >= .3) {
                    vMin -= 0.2;
                    vMax -= 0.2;
                    flashMessage(`decreased speed to [${vMin}, ${vMax}]`);
                }
                break;

            case "ArrowLeft":
                if (vChange > 0) {
                    vChange = Math.max(vChange - 0.1, 0);
                    flashMessage(`decreased speed change to ${vChange}`);
                }
                break;

            case "ArrowRight":
                if (vChange < 2) {
                    vChange = Math.min(vChange + 0.1, 2);
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
                loadSettings(defaultSettings);
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
                flashMessage("unknown key", messageDuration / 2);
                console.log(e.code, `"${e.key}"`);
                return;
        }

        e.preventDefault();
    }

    function createPoint() {
        let p = Object.create(null);
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
        let { h, s, l, h_dir, s_dir, l_dir } = point;
        h = clamp(h + h_dir * Math.random() * colorSpeed, 0, 360);
        s = clamp(s + s_dir * Math.random() * colorSpeed, sMin, sMax);
        l = clamp(l + l_dir * Math.random() * colorSpeed, sMax, lMax);

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
        let { x, y, vx, vy } = point,
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

        if(Math.random() > 0.5) scale = 1 / scale;

        // restrict scale so that resulting speed stays inside limits
        scale = Math.sqrt(clamp(v * scale, vMin, vMax) / v);

        // rotate and scale
        point.vx = scale * (vx * cosR + vy * sinR);
        point.vy = scale * (vy * cosR - vx * sinR);
    }

    function paintPoints() {
        const colors = points.map(stepAndGetColor);

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

        if (++skipCounter > skipFrames) {
            skipCounter = 0;

            paintPoints();
        }

        paintMessages();
    }

    init();
}());
