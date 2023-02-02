
import { useState, useEffect } from "react"
import { TextInput, Button, Select } from '@mantine/core';
import { Group, Text, useMantineTheme } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import axios from "axios";
import { nanoid } from "nanoid";
import { Routes, Route, useNavigate } from "react-router-dom";
import Auth from "./pages/Auth/Auth";
function App() {
  const [user, setUser] = useState(null);
  const [folders, setFolders] = useState([]);
  return(
    <Routes>
      <Route path="/gallery" element={<FileManager user={user} setUser={setUser} folders={folders} setFolders={setFolders}/>}/> 
      <Route path="/"element={<Auth setUser={setUser} setFolders={setFolders}/>}/>
        {/* I think the folders can be queried for the company and set on login   '/api/index.js '  in the response.data > .folders */}
    </Routes>
  )
}



function FileManager({user, setUser, folders, setFolders}) {
  const navigate = useNavigate();
  const usersCompanyId = user?.company;
  // const companies = [0, 1]
  // const [tryingToAccess, setTryingToAccess] = useState(0)
  const [newFolderName, setNewFolderName] = useState("")
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [ downloaded, setDownloaded ] = useState([{filename: ""}])
  const [ notification, setNotification ] = useState([])
  const [ folderChange, setFolderChange ] = useState({folder : "default"})
  const [ JWT, setJWT ] = useState(window.localStorage.getItem("devtoken") || "1234")
  

 // =============================== SHARED WORKER & BROADCAST CHANNEL ==============================================

  const fileManagerBroadcast = new BroadcastChannel("WebSocketChannel");
  const worker = new SharedWorker('./filemanager.worker.js');
  const id = nanoid()
  worker.port.start();
  
  function handleLogout() {
      worker.port.postMessage(
        {type: "end"}
      )
      window.localStorage.setItem("devtoken", "")
      setJWT("")
      setDownloaded([{filename: ""}])
      setUser(null)
      setFolders([])
  }

  //sends the token to sharedworker
  useEffect(() => {
    if (JWT) {
        worker.port.postMessage(
          {type: "token", token: JWT}
        )
    }
	}, [JWT]);

	// handles broadcastChannel msgs
	fileManagerBroadcast.addEventListener("message", event => {
    if (event.data.type === "connected") {
      console.log(event.data)
    }

    if (event.data.type === "uploads") {
      const content = event.data.content
      console.log("entered uploads")
      setDownloaded((old) => {
        return content;
      });
    }

    if (event.data.type === "folders") {
      const content = event.data.content

      setFolders(content);
    }

    if (event.data.type === "notification") {
      const content = event.data.content
      setNotification((old) => {
        return content;
      });
      setTimeout(() => {
        setNotification([]);
      }, 3000);
    }

    if (event.data.type === "keys_redis") {
      const content = event.data.content
      const foldersArr = []
      const filesArr = []

      content.forEach(item => {
        const redisObject = {id: "", filename: "", path: "", belongsto: ""}
      // normalization of REDIS files data to frontend state
        redisObject.belongsto = item.split(":")[0] 
        redisObject.path = item.split(":")[1] 
        redisObject.id = item.split(":")[2] 
        redisObject.filename = item.split(":")[3] 

        filesArr.push(redisObject)

        console.log("files and folders data coming from REDIS through SOCKET")

      // normalization of REDIS folders data to frontend state 
        const folder = item.split(":")[1]

        //pushing if folder is not repeated
        if (foldersArr.indexOf(folder) === -1) {
          foldersArr.push(folder)
        }
      })
      //setting folder state and files state with redis data
      // setFolders(foldersArr) // FOLDERS ARE COMING IN REST API  OR ITS NOT RENDERING EMPTY FOLDERS
      setDownloaded(filesArr)
    }
	});

console.log(folders)

  // =============================== FILES APIS ==============================================

  // IT WAS AN USEEFFECT HERE, NOW ITS ON CLICK ON FOLDERS, IS IT THE BEST OPTION?
  // useEffect(() => {
    async function getFiles() {   
      if (JWT) {
        try {
          const response = await axios.post('/api/getFiles', {usersCompanyId: usersCompanyId, tryingToAccess: usersCompanyId},
              {
                headers: { Authorization: `Bearer ${JWT}` }
              }
          );   
          console.log(response.data)
        } catch (error) {     
            console.log(error);
       }
      }
    }
  //   getFiles()
  // }, [JWT, folders]);


  //delete file rest api call
  async function deleteItem(item) {   
    try {
      const deleteItem = await axios.post('/api/delete', item,
      {
        headers: { Authorization: `Bearer ${JWT}` }
      }
      );   
      console.log(deleteItem.data)
    } catch (error) {     
        console.log(error);
      }
  }

  // delete file from folder 
  const handleDelete = (e, filename, path) => {
    const item = {item: e.target.id, filename: filename, path: path}
  
    deleteItem(item)  
  }

  //move file to another folder on the db
  async function moveFile() {  
    try {
      const post = await axios.post('/api/moveFile', folderChange,
      {
        headers: { Authorization: `Bearer ${JWT}` }
      }
      );   
    } catch (error) {     
        console.log(error);
   }
}
  //move file to another folder button
  const handleMoveFile = () => {
    if (folderChange.folder !== "default") {
      moveFile()
    }
  }

  //select which folder to move file and setstate
  const handleSelect = (e, id, filename, oldpath) => {
        const folderName = e.target.value 
        setFolderChange({path: folderName, id: id, filename: filename, oldpath: oldpath})
  }

  // ================================ FOLDERS APIS ==============================================
  

  //create folder on the db
 async function createFolder(newFolderName) {  
      try {
        const post = await axios.post('/api/createFolder', {folder : newFolderName},
        {
          headers: { Authorization: `Bearer ${JWT}` }
        }
        );   
      } catch (error) {     
          console.log(error);
     }
  }

  //create folders
  const handleAddFolder = () => {
    setFolders(p => {
      if(newFolderName){
        createFolder(newFolderName)
        return [...p, newFolderName]
      } else alert("Folder name cannot be blank")
      return p
    })
    setNewFolderName("")
  }
  
  //folder name input 
  const handleNewFolderInput = (e)=>{
    setNewFolderName(() => e.target.value)
  }

  //delete folder on the db
  async function deleteFolder(folderName) {
    try {
      const post = await axios.post('/api/deleteFolder', {folder : folderName},
      {
        headers: { Authorization: `Bearer ${JWT}` }
      }
      );   
    } catch (error) {     
        console.log(error);
   }
  }

  //delete folder button
  const handleDeleteFolder = (e) => {
    const folderName = e.target.id
    deleteFolder(folderName)
  }

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder)
    getFiles()
  }

  const uploaderProps = {selectedFolder, setDownloaded, JWT}

  console.log(downloaded)

  if(user){
    return (
      <div className="flex flex-col h-full justify-center items-center">
        <div className="w-full flex flex-row h-24 justify-between items-center bg-slate-500 p-4">  
          <button onClick={handleLogout} type="submit">Log out</button>
          {/* -----------------------WELCOME MESSAGE ----------------------------------------------------------------- */}
          <p className="text-white">{user ? `Welcome ${user.username} from ${user.company}` : null}</p>
          {/* Removed the Select */}
          </div>
            <div className="w-full flex grow flex-row">
              <div className="flex grow max-w-xs flex-col p-4 items-center">

                {/* FOLDERS ARE CREATED IN HERE -----------------------------------------------------------------------------------------------------------*/}
                  <div className="w-full flex flex-row items-center justify-center mb-4"><TextInput value={newFolderName} placeholder={"Add New Folder"} onChange={handleNewFolderInput}/><Button className="mx-2" onClick={handleAddFolder}>Add</Button></div>
                  <div className="w-full flex flex-col items-start justify-center">
                    <h3 className="mb-0">Folders</h3>
                    <ul className="w-full list-none p-0">


                {/* FOLDERS ARE RENDERED IN HERE -----------------------------------------------------------------------------------------------------------*/}
                    {folders.map((folder, idx)=> (
                      <li key={folder} className={`w-full text-left p-2 mb-2 ${selectedFolder === folder ? "bg-slate-500" : "bg-slate-400"} text-white cursor-pointer `} onClick={() => handleSelectFolder(folder)}>{folder} <button id={folder} onClick={handleDeleteFolder}>delete</button></li>
                    ))}
                    </ul>
                  </div>
              </div>
              <div className="flex grow flex-col bg-slate-200 p-4">
                <div className="flex-1 pb-2">
                  <Uploader {...uploaderProps}/>
                </div>

                <div className="flex grow bg-slate-300" style={{flex:4}}>


                <div className="flex grow flex-col p-4">
                      {/* NOTIFICATIONS -----------------------------------------------------------*/}
                    {notification && notification.map((current) => {
                      return <div style={{"color" : "red"}}>{current.express}</div>
                    })}
                      
                      {/* FILES FROM DB ------------------------------------------------------------*/}
                    <div>{downloaded.map((curr) => {
                      if (curr.path === selectedFolder) {
                        return <div style={{
                          display:"flex",
                          flexDirection:"column",
                          position:"relative",
                          width:240,
                          height:320,
                          padding:10,
                          border:"1px solid black",
                          justifyContent:'center',
                          alignItems:"center"
                        }}>
                          <div style={{width: 90, position:"absolute", top:5, right:5, padding:5,
                          display:"flex",
                          flexDirection:"column", backgroundColor:"white", borderRadius:5}}>
                            <label>Move To:</label>
                            <select onChange={(e) => handleSelect(e, curr.id, curr.filename, curr.path)}>
                              <option value="default">select folder</option>
                              {folders.map((el, index)=>{
                                if(el !== curr.folder){
                                  return <option value={el} key={index}>{el}</option>
                                } else {
                                  return null
                                }
                              })}
                            </select>

                            <button onClick={handleMoveFile}>confirm</button>
                          </div>

                          {/* ---------------------- IMAGES ARE RENDERED HERE ----------------------------------------------------------- */}
                        <p style={{maxWidth:"100%", overflow:"hidden"}}>{curr.filename}</p>
                          <img style={{"width" : "200px", "height" : "200px"}} src={`http://localhost:4000/${curr.id}`} />
                          <button id={curr.id} onClick={(e) => handleDelete(e, curr.filename, curr.path)}>delete</button>             
                        </div>

                      } else {
                        return <div></div>
                      }

                    })}</div>
                </div>
            </div>
          </div>  
        </div>
      </div>
    );
  } else  return null;
}

export default App;


function Uploader(props) {
  const theme = useMantineTheme();
  const handleUpload = (files) => {
    console.log('accepted files', files)
    postFile(files)
  }

  async function postFile(files) {
    const formData = new FormData();

    files.forEach(file => formData.append("image", file))

    try {
      const post = await axios.post('/api/upload', formData, {
        headers: {folder: props.selectedFolder,  Authorization: `Bearer ${props.JWT}` },
      });   
    } catch (error) {     
        console.log(error);
   }
  }


  return (
    <Dropzone
      disabled={!props.selectedFolder}
      onDrop={handleUpload}
      onReject={(files) => console.log('rejected files', files)}
      maxSize={3 * 1024 ** 2}
      //accepts only image file types
      accept={IMAGE_MIME_TYPE}
      {...props}
    >
      <Group position="center" spacing="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload
            size={50}
            stroke={1.5}
            color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size={50}
            stroke={1.5}
            color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconPhoto size={50} stroke={1.5} />
        </Dropzone.Idle>
        {props.selectedFolder ? 
        <div>
          <Text size="xl" inline>
            Drag images here or click to select files
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Attach as many files as you like, each file should not exceed 5mb
          </Text>
        </div>
          :
          <div>
          <Text size="xl" inline>
            Select a folder to be able to upload files.
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            If you don't have any folders yet, create a new one using the button to the left.
          </Text>
        </div>
        }
      </Group>
    </Dropzone>
  );
}


  {/* <Select
    styles={()=>({
      label: {
        color:"white"
      }
    })}
    label="Trying to view images of"
    value={tryingToAccess}
    onChange={setTryingToAccess}
    data={companies.map((el)=>({value: el, label: `Company ${el + 1}`}))}
  /> */}