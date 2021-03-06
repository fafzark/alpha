const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

// @route GET api/profile/me
// @desc get curr user profile
// @access private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avator']);
    if (!profile) {
      return res.status(400).json({ msg: 'profile not there' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('<api/profile>server error');
  }
});

// @route POST api/profile
// @desc create or update user profile
// @access private

router.post(
  '/',
  [
    auth,
    [
      check('website', 'website is required').not().isEmpty(),
      check('status', 'stauts is required').not().isEmpty(),
      check('skills', 'skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      website,
      status,
      skills,
      youtube,
      instagram,
      facebook,
      twitter,
      linkedin,
    } = req.body;

    //build profiles
    const profileFields = {};
    profileFields.user = req.user.id;
    if (website) profileFields.website = website;
    if (status) profileFields.status = status;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }

    //build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (instagram) profileFields.social.instagram = instagram;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }
      //create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('<api/profile.js>server error');
    }
  }
);

// @route GET api/profile
// @desc get all profile
// @access public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route GET api/profile/user : user_id
// @desc get profile by user id
// @access public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile)
      return res.status(400).json({ msg: 'user dont have any profile' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'user dont have any profile' });
    }
    res.status(500).send('server error');
  }
});

// @route DELETE api/profile
// @desc Delete profile, post and user
// @access public

router.delete('/', auth, async (req, res) => {
  try {
    //todo - remove user posts

    //remove porfiles
    await Profile.findOneAndRemove({ user: req.user.id }).populate('user', [
      'name',
      'avatar',
    ]);

    //remove user
    await Profile.findOneAndRemove({ _id: req.user.id }).populate('user', [
      'name',
      'avatar',
    ]);

    res.json({ msg: 'user deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route PUT api/profile/experience
// @desc add user experience
// @access private

router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'title should be entered').not().isEmpty(),
      check('company', 'company should be entered').not().isEmpty(),
      check('experience', 'experience should be entered').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    const { title, company, experience, from } = req.body;

    const newExp = {
      title,
      company,
      experience,
      from,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

// @route DELETE api/profile/experience/:exp_id
// @desc delete experience from user profile
// @access private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// @route PUT api/profile/education
// @desc add user education
// @access private

router.put(
  '/education',
  [
    auth,
    [
      check('school', 'school should be entered').not().isEmpty(),
      check('degree', 'degree should be entered').not().isEmpty(),
      check('fieldofstudy', 'fieldofstudy should be entered').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send({ errors: errors.array() });
    }

    const { school, degree, fieldofstudy } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
    };
    try {
      const profile = await Profile.findOne({ user: req.user.id });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
  }
);

// @route DELETE api/profile/education/:edu_id
// @desc delete education from user profile
// @access private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //get remove index
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('server error');
  }
});

module.exports = router;
