import { Language } from '../models/Language.js';

// @desc    Get all languages
// @route   GET /api/languages
// @access  Public
export const getLanguages = async (req, res) => {
    try {
        const languages = await Language.find({ isEnabled: true });
        res.json(languages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get language by code
// @route   GET /api/languages/:code
// @access  Public
export const getLanguageByCode = async (req, res) => {
    try {
        const language = await Language.findOne({ code: req.params.code });
        if (language) {
            res.json(language);
        } else {
            res.status(404).json({ message: 'Language not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create or update language (translations)
// @route   POST /api/languages
// @access  Private/Admin
export const upsertLanguage = async (req, res) => {
    const { code, name, translations, isEnabled } = req.body;

    try {
        let language = await Language.findOne({ code });

        if (language) {
            language.name = name || language.name;
            language.isEnabled = isEnabled !== undefined ? isEnabled : language.isEnabled;
            if (translations) {
                language.translations = translations;
            }
            await language.save();
        } else {
            language = await Language.create({
                code,
                name,
                translations,
                isEnabled
            });
        }

        res.status(201).json(language);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
