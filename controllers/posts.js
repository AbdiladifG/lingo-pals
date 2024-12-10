const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");

module.exports = {
  getFeed: async (req, res) => {
    try {
      const posts = await Post.aggregate([
        { "$match": { "feedLanguage": req.params.feedLanguage } }, 
        {
           $lookup: {
              from: "users",
              localField: "user",    // field in the orders collection
              foreignField: "_id",  // field in the items collection
              as: "posters"
           }
        }],).sort({ createdAt: "desc" })
      const user = await User.findById(req.params.id)
      res.render("feed.ejs", { posts: posts, user: req.user,feedLanguage: req.params.feedLanguage});
    } catch (err) {
      console.log(err);
    }
  },
  getPost: async (req, res) => {
    try {
      
      const post = await Post.findById(req.params.id);
      const poster = await User.findById(post.user);
      const comments = await Comment.find({post: req.params.id}).sort({createdAt: 1}).lean();
      res.render("post.ejs", { post: post, user: req.user, comments: comments, poster: poster });
    } catch (err) {
      console.log(err);
    }
  },
  createPost: async (req, res) => {
    try {
      // Upload image to cloudinary
      if(req.file !== undefined){
        const result = await cloudinary.uploader.upload(req.file.path);
        await Post.create({
          image: result.secure_url,
          cloudinaryId: result.public_id,
          caption: req.body.caption,
          likes: 0,
          user: req.user.id,
          feedLanguage: req.body.language
        });
      }
      else{
        await Post.create({
          caption: req.body.caption,
          likes: 0,
          user: req.user.id,
          feedLanguage: req.body.language
        });
      }
      console.log("Post has been added!");
      res.redirect("back");
    } catch (err) {
      console.log(err);
    }
  },
  likePost: async (req, res) => {
    try {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  deletePost: async (req, res) => {
    try {
      // Find post by id
      let post = await Post.findById({ _id: req.params.id });
      // Delete image from cloudinary
      await cloudinary.uploader.destroy(post.cloudinaryId);
      // Delete post from db
      await Post.remove({ _id: req.params.id });
      console.log("Deleted Post");
      res.redirect(`/feed/${req.user.selectedLanguage}`);
    } catch (err) {
      res.redirect(`/feed/${req.user.selectedLanguage}`);
    }
  },
};
