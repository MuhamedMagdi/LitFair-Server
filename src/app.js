const express = require('express');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const cookies = require('cookie-parser');
const fs = require('fs')
const path = require('path');

require('dotenv').config();

require('./services/mq/worker');
const mq = require('./utils/mq');
const mqConfig = require('./config/mq');
const {SkillsRoutes}= require('./services/search/skills/skills.routes')
const {JobTitleRoutes}= require('./services/search/jobTitle/jobtitle.routes')
const {locationRoutes}= require('./services/search/location/location.routes')
const {JobCategoriesRoutes}= require('./services/search/jobCategory/jobCategories.routes')
const {UserRoutes} = require('./services/User/userRoutes.routes');
const {SeekerRoutes} = require('./services/seeker/seeker.routes')
const {deleteFolder} = require('./config/multer')
deleteFolder(path.join('..','tmp'))
const jobService= require('./services/job');
const companyService = require('./services/company');
const jobConfig = require('./services/public_config/job.routes');
const { workspace } = require('./config/env');

const port = process.env.PORT || 8000;


if(workspace != 'cupcake'){

  app.use((req,res,next)=>{
    
    const os =(req)=>{
      const agent=req.get("user-agent")
      if(agent.search("Win64")!= -1){
        return "Windows";
      }else if(agent.search("Android")!=-1){
      return "Android";
      }else if(agent.search("iPhone OS")){
        return "iOS";
      }
      
    }
    
    time = new Date(); 
    timeF=time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds() 
    console.table({
      sourceIp:req.socket.remoteAddress,
      route:req.path,time:timeF,
      os:os(req)
    });
    console.log(req.get("user-agent"))
    console.log("#################################")
    next()}
  )
}



app.use(cors(
  { 
    origin: true,
    credentials: true}
));  
app.use(cookies())
app.use(express.json());
app.use(morgan("dev"));


const testConnection = require('./DB/SQL.config').testConnection;
testConnection();

app.use(UserRoutes);
app.use(SeekerRoutes);
app.use(SkillsRoutes);
app.use(JobTitleRoutes);
app.use(JobCategoriesRoutes)
app.use(locationRoutes)
app.use(jobConfig)
jobService(app);
companyService(app);

app.get('*', (req, res) => {
  res.send({msg:"hi anyone"});
});


// testing the logic of mq
// this should be inside the logic for saving interview videos

app.post('/mq', (req, res) => {
  const body = req.body;
  mq.publish(mqConfig.publisher, body);
  res.send({success: true});
});

app.listen(port, ()=>{console.log(`Server Listing on PORT-${port}`)});
