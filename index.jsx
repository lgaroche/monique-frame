"use strict"
import React from "react"
import Koa from "koa"
import satori from "satori"
import fs from "fs"

const app = new Koa()

const interSemiBold = fs.readFileSync('./Inter-SemiBold.ttf')

const bodyStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "300px",
  justifyContent: "center",
  background: "#282828",
  paddingBottom: "25px",
}

const style = { 
  display: "flex",
  justifyContent: "center",
  width: "100%",
  color: "white", 
}

const textStyle = {
  fontFamily: 'Inter',
  fontSize: 24,
  fontWeight: 600,
  fontStyle: 'normal',
  color: 'white',
  borderRadius: "10px", 
}

const pillStyle = {
  ...textStyle,
  background: "rgb(19, 127, 162)",
  padding: "5px",
}

const cloudify = (url) => {
  return `https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_png,w_168/${encodeURIComponent(url)}`
}

app.use(async ctx => {
  const {fid} = ctx.request.query

  if (!fid) {
    ctx.body = "No fid provided"
    return
  }
  
  let userInfo = {
    fid,
    pfp: cloudify("https://explorer.farcaster.xyz/avatar.png"),
    name: "",
    display: "",
    address: "",
    monic: ""
  }

  try {
    const res = await fetch(`http://192.168.1.131:2281/v1/userDataByFid?fid=${fid}`)
    const {messages} = await res.json()
    
    for (const {data} of messages) {
      const {type, value} = data.userDataBody
      switch (type) {
        case "USER_DATA_TYPE_PFP":
          console.log(value)
          userInfo.pfp = cloudify(value)
          break
        case "USER_DATA_TYPE_USERNAME":
          userInfo.name = value
          break
        case "USER_DATA_TYPE_DISPLAY":
          userInfo.display = value
          break
      }
    }
  } catch (e) {
    console.log(e)
  }

  try {
    const res = await fetch(`http://192.168.1.131:2281/v1/verificationsByFid?fid=${fid}`)
    const {messages} = await res.json()
    if (messages.length > 0) {
      userInfo.address = messages[messages.length - 1].data.verificationAddEthAddressBody.address
    }
  } catch (e) {
    console.log(e)
  }
  
  try {
    const monicRes = await fetch(`https://api.monique.app/alias/${userInfo.address}`)
    const {monic} = await monicRes.json()
    userInfo.monic = monic
  } catch (e) { 
    console.log(e)
  }
  console.log(userInfo)
  const monic = userInfo.monic?.split(' ') || ['', '', '']
  const svg = await satori(
    <div style={bodyStyle}>
      <div style={{...style, padding: "20px"}}>
        <img 
          style={{ borderRadius: "50%", marginRight: 10 }}
          src={userInfo.pfp} 
          alt="pfp" 
          width="48" 
          height="48" 
          />
        <div style={{display: "flex", flexDirection: "column"}}>
          <div style={{...textStyle}}>{userInfo.display}</div>
          <div style={{...textStyle, fontSize: "16px", color: "grey"}}>{userInfo.name}</div>
        </div>
      </div>
      <div style={{...style}}>
        <p style={{...pillStyle, marginRight: "5px"}}>{monic[0]}</p>
        <p style={{...pillStyle, marginRight: "5px"}}>{monic[1]}</p>
        <p style={{...pillStyle}}>{monic[2]}</p>
      </div>
      <div style={{...style}}>
        <p style={{...textStyle, marginLeft: "2px", fontSize: "16px", color: "grey"}}>{userInfo.address || "No address found"}</p>
      </div>
    </div>
    
    , {
    width: 573,
    height: 300,
    fonts: [
      {
        name: 'Inter',
        data: interSemiBold,
        weight: 600,
        style: 'normal',
      },
    ],
  })


  ctx.body = `
    <html>
      <head>
        <title>Monique Frame</title>
        <meta charset="utf-8">
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="data:image/svg+xml;base64,${btoa(svg)}" />
        <meta property="fc:frame:button:1" content="Reveal mine" />
      </head>
      <body>
        ${svg}
      </body>
  `
})

app.listen(3000)
