import { StateService } from '@uirouter/core';

/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// tslint:disable-next-line:no-var-requires
require('@gravitee/ui-components/wc/gv-policy-studio');

class ApiPolicyStudioController {
  private studio: Element;
  private api: any;
  private CATEGORY_POLICY = ['security', 'performance', 'transformation', 'others'];

  constructor(
    private resolvedResources,
    private resolvedPolicies,
    private resolvedFlowSchema,
    private PolicyService,
    private ResourceService,
    private $scope,
    private ApiService,
    private NotificationService,
    private $rootScope,
    private $stateParams,
    private $location,
  ) {
    'ngInject';
  }

  $onInit = () => {
    const propertyProviders = [
      {
        'id': 'HTTP',
        'name': 'Custom (HTTP)',
        'schema': {
          'type': 'object',
          'properties': {
            'url': {
              'title': 'Http service URL',
              'description': 'http://localhost',
              'type': 'string',
              'pattern': '^(http://|https://)'
            },
            'specification': {
              'title': 'Transformation (JOLT Specification)',
              'type': 'string',
              'x-schema-form': {
                'type': 'codemirror',
                'codemirrorOptions': {
                  'lineWrapping': true,
                  'lineNumbers': true,
                  'allowDropFileTypes': true,
                  'autoCloseTags': true,
                  'mode': 'javascript'
                }
              }
            }
          },
          'required': ['url']
        },
        'documentation': '= Custom (HTTP)\n\n=== How to ?\n\n 1. Set `Polling frequency interval` and `Time unit`\n2. Set the `HTTP service URL`\n 3. If the HTTP service doesn\'t return the expected output, add a JOLT `transformation` \n\n[source, json]\n----\n[\n  {\n    "key": 1,\n    "value": "https://north-europe.company.com/"\n  },\n  {\n    "key": 2,\n    "value": "https://north-europe.company.com/"\n  },\n  {\n    "key": 3,\n    "value": "https://south-asia.company.com/"\n  }\n]\n----\n'
      }
    ];

    this.resolvedPolicies.data.sort((a, b) => {
      if (a.category == null) {
        a.category = this.CATEGORY_POLICY[3];
      }
      if (b.category == null) {
        b.category = this.CATEGORY_POLICY[3];
      }
      if (a.category === b.category) {
        return 0;
      }
      const aKind = this.CATEGORY_POLICY.indexOf(a.category);
      if (aKind === -1) {
        return 1;
      }
      const bKind = this.CATEGORY_POLICY.indexOf(b.category);
      if (bKind === -1) {
        return -1;
      }
      return aKind < bKind ? -1 : 1;
    });
    this.studio = document.querySelector('gv-policy-studio');
    this.setApi(this.$scope.$parent.apiCtrl.api);
    this.ApiService.get(this.$stateParams.apiId).then((response) => {
      this.setApi(response.data);
    });

    this.studio.setAttribute('tab-id', this.$location.hash());
    let selectedFlows = null;
    const flowsParam = this.$location.search().flows;
    if (typeof flowsParam === 'string') {
      selectedFlows = [flowsParam];
    } else if (Array.isArray(flowsParam)) {
      selectedFlows = flowsParam;
    }
    this.studio.setAttribute('selected-flows-id', JSON.stringify(selectedFlows));
    this.studio.setAttribute('resource-types', JSON.stringify(this.resolvedResources.data));
    this.studio.setAttribute('policies', JSON.stringify(this.resolvedPolicies.data));
    this.studio.setAttribute('flowSettingsForm', JSON.stringify(this.resolvedFlowSchema.data));
    this.studio.setAttribute('property-providers', JSON.stringify(propertyProviders));
    this.studio.addEventListener('gv-policy-studio:save', this.onSave.bind(this));
    this.studio.addEventListener('gv-policy-studio:select-flows', this.onSelectFlows.bind(this));
    this.studio.addEventListener('gv-policy-studio:change-tab', this.onChangeTab.bind(this));
    this.studio.addEventListener('gv-policy-studio:fetch-documentation', this.fetchPolicyDocumentation.bind(this));
    this.studio.addEventListener('gv-resources:fetch-documentation', this.fetchResourceDocumentation.bind(this));
  }

  setApi(api) {
    if (api !== this.api) {
      this.api = api;
      // force refresh
      this.studio.removeAttribute('definition');
      this.studio.setAttribute('definition', JSON.stringify({
        'name': this.api.name,
        'version': this.api.version,
        'flows': this.api.flows != null ? this.api.flows : [],
        'resources': this.api.resources,
        'plans': this.api.plans != null ? this.api.plans : [],
        'properties': this.api.properties,
      }));
      // force refresh
      this.studio.removeAttribute('services');
      this.studio.setAttribute('services', JSON.stringify(this.api.services));
      this.studio.removeAttribute('dirty');
    }
  }

  onChangeTab({detail}) {
    this.$location.hash(detail);
    this.$rootScope.$digest();
  }

  onSelectFlows({detail: {flows}}) {
    this.$location.search('flows', flows);
    this.$rootScope.$digest();
  }

  fetchPolicyDocumentation({detail}) {
    const policy = detail.policy;
    this.studio.setAttribute('documentation', null);
    this.PolicyService.getDocumentation(policy.id).then((response) => {
      this.studio.setAttribute('documentation', JSON.stringify({content: response.data, image: policy.icon, id: policy.id}));
    });
  }

  fetchResourceDocumentation(event) {
    this.studio.setAttribute('documentation', null);
    const {detail: {resourceType, target}} = event;
    // force refresh
    target.setAttribute('documentation', null);
    this.ResourceService.getDocumentation(resourceType.id).then((response) => {
      target.setAttribute('documentation', JSON.stringify({content: response.data, image: resourceType.icon}));
    });
  }

  onSave({detail: {definition, services}}) {
    this.api.flows = definition.flows;
    this.api.plans = definition.plans;
    this.api.resources = definition.resources;
    this.api.properties = definition.properties;
    this.api.services = services;
    this.ApiService.update(this.api).then((updatedApi) => {
      this.NotificationService.show('Design of api has been updated');
      this.setApi(updatedApi.data);
      this.$rootScope.$broadcast('apiChangeSuccess', {api: this.api});
    });
  }

}

export default ApiPolicyStudioController;
