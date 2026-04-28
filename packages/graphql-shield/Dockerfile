FROM 278521702583.dkr.ecr.us-west-2.amazonaws.com/arch/node-v20-jammy:v1.2.0

ARG COMPONENT

ENV APP_DIR /siteminder/app

WORKDIR "${APP_DIR}"

COPY ["build/*.zip", "${APP_DIR}/"]

RUN unzip -qo $COMPONENT-*.zip && rm $COMPONENT-*.zip

EXPOSE 3000

CMD ["node", "/siteminder/app/main.js"]
