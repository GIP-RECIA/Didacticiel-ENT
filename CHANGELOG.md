# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 1.0.0 (2025-08-26)


### Features

* add asking before tour ([1e7c3ec](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/1e7c3ecd035cba2da9b12e4c9cdcee3e0d45afbb))
* add breakpoint for display ([88302af](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/88302af029862f5d71837ec270bdfab22345f098))
* add more properties from attributes ([d704419](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/d70441952942f789533ae4e58ea3df50d1b7b6b4))
* add small delay to waitForElement ([1c76854](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/1c7685419d43207521db059dd4e37a0efcb2aa32))
* add style ([4afbc47](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/4afbc4783accbba0aa67d395835eb17c539bd2d2))
* change starter event name and internal id ([61a0872](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/61a0872d79e234a2d2631292b684b71236ecd01c))
* create getProperty method ([68b49c6](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/68b49c6af142ea9b309b59c2f795e00929e600fa))
* enable asking for each user, enable checking for completion ([6b4bfea](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/6b4bfea1c87c2b57a8ec63e0a1770a4986482feb))
* first iteration (without CSS) ([9e6051a](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/9e6051a1d9f63f6f05dc7c25dd9fd2ed855e40b1))
* force pre tour to be unclosable ([f2ed4d6](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/f2ed4d6a83ceea90323076c79ad292851b1d0e8c))
* make waitForElement destroy tour, free event and scroll when failing ([fd6f7cb](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/fd6f7cbf5c726361bf439d91634d894b80e594d6))
* refactor getTitle, extract getBtnClose, require one optional argument, remove icon from title ([68d2b36](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/68d2b363e6d30c1e875918563496f841b9b0fc3a))
* remove hardcoded event listener ([82476e4](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/82476e4fac8825664ea9420a95cfc7aec4e84136))
* rename property ([43dd41c](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/43dd41cff022e4e55025db49063ab4a4e57c41db))
* update style ([1750c36](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/1750c36c6a1276a6e9f6f2788b9f1a0ce5eb1a54))


### Bug Fixes

*  handle nullish values in conditions ([1fa4b50](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/1fa4b50ebef5f7cce4739c1329cc7dbfefcb684e))
* add event to button even if not on allowed user list ([4f897b9](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/4f897b9bfcdd92a07922809815a1d1f514118b36))
* add missing typing for getConfJson ([1ca4499](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/1ca4499d1e07b9019b0ce567b5310b1c7e7cf56a))
* add outline to close button on focus ([fe830b8](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/fe830b86ffce1ec6d1268628315568c61d258aea))
* block events, wait for display before moving steps ([07262da](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/07262da85545d028bfb8b66036f769707593494a))
* change id for self query selector to match project name ([aafd60f](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/aafd60f86cbfa69a546b3a25c7c82833095f0910))
* create title of pre tour using getTitle ([2fc3b06](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/2fc3b0656f1d9bd297c19f3d07e9421714713fc8))
* disable close button if config don't allow exit ([e18beed](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/e18beeda6b8d618e7509124b32bbfae1e00c3f11))
* fix env.production ([d881701](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/d881701cd7ad4712ed1178d720f4b6418fdf4ce1))
* fix event name ([04f624f](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/04f624f86286ca95d4dcb240a0caf245e0e1c7fd))
* fix render lambda, correctly hide close button when closing is disabled ([7a6356a](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/7a6356ad27239254eb350b9d98806ba3f64ffde7))
* fix title color ([288a0b9](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/288a0b95fb2cbf52880f25b384e205bb459df7f0))
* fix waitForElement condition syntax ([c298ad5](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/c298ad5bd702faa18e14157824fd24e187478810))
* intercept keyup event from popover ([d2464ff](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/d2464ffe1ba9840d80cda6ffc42a9f7e111fe549))
* read event detail for replay of driver ([e458f02](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/e458f02b4c7168510f5a684110bc632a02c69964))
* remove unused code ([113f772](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/113f772611361020bfb16f000071e28b4aaabe1d))
* reset overflow style when destroying tour ([3af1ae7](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/3af1ae752891c8f7bc0b241b0b93743857cfcbce))
* use already existing event fired by tutorial button to restart driver ([1dbfee0](https://github.com/GIP-RECIA/Didacticiel-ENT/commit/1dbfee0c94a45d61003c3b8878421283b49bf5f3))
