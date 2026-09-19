let asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((e)=>next(e));
    }
}

export default asyncHandler;













































// let asyncHandler = (func) => async (req,res,next)=>{
//     try {
//         await func(req,res,next);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         });
//     }
// }