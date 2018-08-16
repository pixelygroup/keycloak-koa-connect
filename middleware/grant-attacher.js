"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by zhangsong on 2018/8/9.
 */
function default_1(keycloak) {
    return function grantAttacher(ctx, next) {
        return __awaiter(this, void 0, void 0, function* () {
            ctx.state.kauth.grant = yield keycloak.getGrant(ctx);
            yield next();
        });
    };
}
exports.default = default_1;
//# sourceMappingURL=grant-attacher.js.map