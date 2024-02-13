const webp: any = require('node-webpmux'); //doesnt support getting frames from webp but makes it easier to get frame data 
import fs from 'fs'
import crypto from 'crypto';


async function dumpFrame(input: string, output: string) {
    //webpmux -get frame 8 /Users/alexpickett/Desktop/Projects/7TVScraping/downloadImages/cleaner/images/AAAA.webp -o /Users/alexpickett/Desktop/Projects/7TVScraping/downloadImages/cleaner/testOut/frame8.webp
    // make a loop for each frame in the webp

    const process = Bun.spawn(["anim_dump", "-folder", output, input])

    
    const out = await new Response(process.stdout).text();
    //handle error case probably just throw the whole thing away 
    const err = await new Response(process.stderr).text();
    await process.exited
    return {out:out, error:err}
}

async function combineFrames(input: string, output: string, frameRate: number) {
    const process = Bun.spawn(["ffmpeg", "-y", "-framerate", frameRate.toString(), "-i", input, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-crf", "0", "-b:v", "1M", output])
    const out = await new Response(process.stdout).text();
    //handle error case probably just throw the whole thing away 
    const err = await new Response(process.stderr).text();
    await process.exited
    return {out:out, error:err}
}

export default async function convertWebpToWebm(input: string, output: string) {
    //check if webp is animated
    let img = new webp.Image();
    await img.load(input)

    const isAnimated = await img.hasAnim

    if (!isAnimated) {
        return
    }

    let frameCount = img.frames.length
    let frames = img.frames


    let frameDelayTotal = 0

    let random = crypto.randomBytes(5).toString('hex')
    const tmpFolder = `./tmpFrames-${random}`
    fs.mkdirSync(tmpFolder)
    for(let i = 0; i < frameCount; i++){
        frameDelayTotal += frames[i].delay
    }
    let  dump = await dumpFrame(input, `${tmpFolder}`)
    if(dump.error){
        // console.log(combo.error)
        return dump.error
    }

    let fps = Math.round(1000 / (frameDelayTotal / frameCount))
    console.log(fps)

    let combo = await combineFrames(`${tmpFolder}/dump_%04d.png`, output, fps)
    if(combo.error){
        console.log(combo.error)
        return combo.error
    }
    
    return combo

}

// convertWebpToWebm("./image.webp", "output.webm")
