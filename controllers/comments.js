const cloudinary = require("../middleware/cloudinary");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

module.exports = {
  getComment: async (req, res) => {
    try {
      const comments = await Comment.find({post: req.params.id}).lean();
      res.render("post.ejs", { post: post, user: req.user, comments: comments});
    } catch (err) {
      console.log(err);
    }
  },
  createComment: async (req, res) => {
    try {
    //   const post = ObjectID(req.params.id)
      await Comment.create({
        comment: req.body.comment,
        likes: 0,
        post: req.params.id,
        user: req.user.id,
        // poster: req.user.userName,
      });
      console.log("Post has been added!");
      res.redirect(`/post/${req.params.id}`);
    } catch (err) {
      console.log(err);
    }
  },
  likeComment: async (req, res) => {
    try {
      await Comment.findOneAndUpdate(
        { _id: req.params.id },
        {
          $inc: { likes: 1 },
        }
      );
      console.log("Likes +1");
      res.redirect(req.get('referer'));
    //   res.redirect(`/post/${req.params.id}`);
    
    } catch (err) {
      console.log(err);
    }
  },
  deleteComment: async (req, res) => {
    try {
      // Find post by id
      await Comment.remove({ _id: req.params.id });
      console.log("Deleted Comment");
      res.redirect(req.get('referer'));
    } catch (err) {
      res.redirect(req.get('referer'));
    }
  },
};
