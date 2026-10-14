export const test = (req, res)=>{
    return res.status(200).json({message : "Test Controller is Running"});
}